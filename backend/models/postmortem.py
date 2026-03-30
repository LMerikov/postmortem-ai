import json
import logging
import uuid
from datetime import datetime, timezone
from config import Config

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Database abstraction: PostgreSQL (production) or SQLite (local dev)
# ---------------------------------------------------------------------------
USE_POSTGRES = bool(Config.DATABASE_URL)

if USE_POSTGRES:
    import psycopg2
    import psycopg2.extras
    from psycopg2 import pool as psycopg2_pool

    _pg_pool = psycopg2_pool.ThreadedConnectionPool(
        minconn=1,
        maxconn=10,
        dsn=Config.DATABASE_URL,
        connect_timeout=5
    )
else:
    import sqlite3


def get_db():
    if USE_POSTGRES:
        conn = _pg_pool.getconn()
        return conn
    else:
        conn = sqlite3.connect(Config.DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        return conn


def release_db(conn):
    """Devuelve la conexión al pool (solo PostgreSQL)."""
    if USE_POSTGRES:
        _pg_pool.putconn(conn)
    else:
        conn.close()


def init_db():
    """Initialize postmortems table (compatible with PostgreSQL and SQLite)."""
    conn = get_db()
    cur = conn.cursor()

    # SQL is compatible with both PostgreSQL and SQLite for this schema
    cur.execute("""
        CREATE TABLE IF NOT EXISTS postmortems (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            severity TEXT NOT NULL,
            summary TEXT,
            data TEXT NOT NULL,
            source TEXT DEFAULT 'analyze',
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    cur.close()
    release_db(conn)

    # Initialize cache table (Phase 2)
    try:
        from services.cache_service import init_cache_table
        init_cache_table()
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"init_cache_table failed: {e}")


def save_postmortem(postmortem_data: dict, source: str = "analyze") -> str:
    """Save postmortem to database. Returns ID (persists even if DB is unavailable)."""
    postmortem_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    # Path 1: DB connection failure
    try:
        conn = get_db()
    except Exception as e:
        logger.warning(f"DB unavailable, skipping save: {e}")
        return postmortem_id

    # Path 2: DB insert success or failure
    try:
        cur = conn.cursor()
        values = (
            postmortem_id,
            postmortem_data.get("title", "Untitled Incident"),
            postmortem_data.get("severity", "P3"),
            postmortem_data.get("summary", ""),
            json.dumps(postmortem_data),
            source,
            now,
        )

        # Use appropriate placeholder syntax for each database
        placeholders = "%s" if USE_POSTGRES else "?"
        placeholder_list = ", ".join([placeholders] * 7)
        cur.execute(
            f"INSERT INTO postmortems (id, title, severity, summary, data, source, created_at) VALUES ({placeholder_list})",
            values,
        )
        conn.commit()
        logger.debug(f"Postmortem saved: {postmortem_id} (source={source})")
    except Exception as e:
        logger.error(f"Failed to save postmortem {postmortem_id}: {e}")
    finally:
        cur.close()
        release_db(conn)

    return postmortem_id


def get_all_postmortems():
    """Get all postmortems ordered by creation date (newest first)."""
    conn = get_db()
    query = "SELECT id, title, severity, summary, source, created_at FROM postmortems ORDER BY created_at DESC"

    try:
        if USE_POSTGRES:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute(query)
            rows = cur.fetchall()
            cur.close()
            return [dict(r) for r in rows]
        else:
            rows = conn.execute(query).fetchall()
            return [dict(r) for r in rows]
    finally:
        release_db(conn)


def get_postmortem_by_id(postmortem_id: str):
    """Get a postmortem by ID with parsed JSON data."""
    conn = get_db()

    try:
        if USE_POSTGRES:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute("SELECT * FROM postmortems WHERE id = %s", (postmortem_id,))
            row = cur.fetchone()
            cur.close()
        else:
            row = conn.execute(
                "SELECT * FROM postmortems WHERE id = ?", (postmortem_id,)
            ).fetchone()

        if row:
            data = dict(row)
            data["data"] = json.loads(data["data"])
            return data
        return None
    finally:
        release_db(conn)


def get_total_count() -> int:
    """Returns total number of postmortems stored."""
    conn = get_db()
    try:
        if USE_POSTGRES:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM postmortems")
            count = cur.fetchone()[0]
            cur.close()
        else:
            cur = conn.execute("SELECT COUNT(*) FROM postmortems")
            count = cur.fetchone()[0]
        return count
    except Exception:
        return 0
    finally:
        release_db(conn)


def _empty_dashboard_stats() -> dict:
    return {
        "total_postmortems": 0,
        "severity_distribution": {"P0": 0, "P1": 0, "P2": 0, "P3": 0, "P4": 0},
        "source_distribution": {},
        "error_types": {},
        "avg_confidence": 0,
    }


def _fetch_dashboard_rows(conn):
    if USE_POSTGRES:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT COUNT(*) as total FROM postmortems")
        total = cur.fetchone()["total"]
        cur.execute("SELECT severity, COUNT(*) as count FROM postmortems GROUP BY severity ORDER BY severity")
        severity_rows = cur.fetchall()
        cur.execute("SELECT source, COUNT(*) as count FROM postmortems GROUP BY source")
        source_rows = cur.fetchall()
        cur.execute("SELECT data FROM postmortems ORDER BY created_at DESC LIMIT 100")
        data_rows = cur.fetchall()
        cur.close()
        return total, severity_rows, source_rows, data_rows

    total = conn.execute("SELECT COUNT(*) as total FROM postmortems").fetchone()["total"]
    severity_rows = conn.execute(
        "SELECT severity, COUNT(*) as count FROM postmortems GROUP BY severity ORDER BY severity"
    ).fetchall()
    source_rows = conn.execute(
        "SELECT source, COUNT(*) as count FROM postmortems GROUP BY source"
    ).fetchall()
    data_rows = conn.execute(
        "SELECT data FROM postmortems ORDER BY created_at DESC LIMIT 100"
    ).fetchall()
    return total, severity_rows, source_rows, data_rows


def _build_severity_distribution(severity_rows) -> dict:
    severity_dist = {"P0": 0, "P1": 0, "P2": 0, "P3": 0, "P4": 0}
    for row in severity_rows:
        row_dict = dict(row)
        severity = row_dict.get("severity", "P3")
        if severity in severity_dist:
            severity_dist[severity] = row_dict["count"]
    return severity_dist


def _build_source_distribution(source_rows) -> dict:
    source_dist = {}
    for row in source_rows:
        row_dict = dict(row)
        source_dist[row_dict.get("source", "analyze")] = row_dict["count"]
    return source_dist


def _extract_dashboard_metrics(data_rows):
    error_types = {}
    confidence_values = []

    for row in data_rows:
        try:
            row_data = dict(row)["data"]
            parsed = json.loads(row_data) if isinstance(row_data, str) else row_data
            error_classification = parsed.get("error_classification", {})
            error_type = error_classification.get("type", "Unknown") if error_classification else "Unknown"
            error_types[error_type] = error_types.get(error_type, 0) + 1

            confidence = parsed.get("confidence_level", "")
            if confidence:
                numeric_confidence = "".join(filter(str.isdigit, str(confidence)))
                if numeric_confidence:
                    confidence_values.append(int(numeric_confidence))
        except Exception:
            continue

    avg_confidence = round(sum(confidence_values) / len(confidence_values)) if confidence_values else 0
    sorted_error_types = dict(sorted(error_types.items(), key=lambda item: item[1], reverse=True))
    return sorted_error_types, avg_confidence


def get_dashboard_stats() -> dict:
    """Returns aggregated stats for the dashboard."""
    conn = get_db()
    try:
        total, severity_rows, source_rows, data_rows = _fetch_dashboard_rows(conn)
        severity_dist = _build_severity_distribution(severity_rows)
        source_dist = _build_source_distribution(source_rows)
        error_types, avg_confidence = _extract_dashboard_metrics(data_rows)

        return {
            "total_postmortems": total,
            "severity_distribution": severity_dist,
            "source_distribution": source_dist,
            "error_types": error_types,
            "avg_confidence": avg_confidence,
        }
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {e}")
        return _empty_dashboard_stats()
    finally:
        release_db(conn)


def delete_postmortem(postmortem_id: str) -> bool:
    """Delete postmortem by ID. Returns True if a row was deleted."""
    conn = get_db()

    try:
        if USE_POSTGRES:
            cur = conn.cursor()
            cur.execute("DELETE FROM postmortems WHERE id = %s", (postmortem_id,))
            affected = cur.rowcount
            cur.close()
        else:
            cur = conn.execute("DELETE FROM postmortems WHERE id = ?", (postmortem_id,))
            affected = cur.rowcount

        conn.commit()
        return affected > 0
    finally:
        release_db(conn)
