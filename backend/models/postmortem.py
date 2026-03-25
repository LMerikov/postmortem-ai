import json
import uuid
from datetime import datetime
from config import Config

# ---------------------------------------------------------------------------
# Database abstraction: PostgreSQL (production) or SQLite (local dev)
# ---------------------------------------------------------------------------
USE_POSTGRES = bool(Config.DATABASE_URL)

if USE_POSTGRES:
    import psycopg2
    import psycopg2.extras
else:
    import sqlite3


def get_db():
    if USE_POSTGRES:
        conn = psycopg2.connect(Config.DATABASE_URL)
        return conn
    else:
        conn = sqlite3.connect(Config.DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        return conn


def init_db():
    conn = get_db()
    cur = conn.cursor()
    if USE_POSTGRES:
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
    else:
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
    conn.close()


def save_postmortem(postmortem_data: dict, source: str = "analyze") -> str:
    postmortem_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    conn = get_db()
    cur = conn.cursor()
    if USE_POSTGRES:
        cur.execute(
            "INSERT INTO postmortems (id, title, severity, summary, data, source, created_at) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (
                postmortem_id,
                postmortem_data.get("title", "Untitled Incident"),
                postmortem_data.get("severity", "P3"),
                postmortem_data.get("summary", ""),
                json.dumps(postmortem_data),
                source,
                now,
            ),
        )
    else:
        cur.execute(
            "INSERT INTO postmortems (id, title, severity, summary, data, source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                postmortem_id,
                postmortem_data.get("title", "Untitled Incident"),
                postmortem_data.get("severity", "P3"),
                postmortem_data.get("summary", ""),
                json.dumps(postmortem_data),
                source,
                now,
            ),
        )
    conn.commit()
    cur.close()
    conn.close()
    return postmortem_id


def get_all_postmortems():
    conn = get_db()
    if USE_POSTGRES:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT id, title, severity, summary, source, created_at FROM postmortems ORDER BY created_at DESC"
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [dict(r) for r in rows]
    else:
        rows = conn.execute(
            "SELECT id, title, severity, summary, source, created_at FROM postmortems ORDER BY created_at DESC"
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]


def get_postmortem_by_id(postmortem_id: str):
    conn = get_db()
    if USE_POSTGRES:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM postmortems WHERE id = %s", (postmortem_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if row:
            data = dict(row)
            data["data"] = json.loads(data["data"])
            return data
        return None
    else:
        row = conn.execute(
            "SELECT * FROM postmortems WHERE id = ?", (postmortem_id,)
        ).fetchone()
        conn.close()
        if row:
            data = dict(row)
            data["data"] = json.loads(data["data"])
            return data
        return None


def delete_postmortem(postmortem_id: str) -> bool:
    conn = get_db()
    if USE_POSTGRES:
        cur = conn.cursor()
        cur.execute("DELETE FROM postmortems WHERE id = %s", (postmortem_id,))
        affected = cur.rowcount
        conn.commit()
        cur.close()
        conn.close()
        return affected > 0
    else:
        cur = conn.execute("DELETE FROM postmortems WHERE id = ?", (postmortem_id,))
        conn.commit()
        conn.close()
        return cur.rowcount > 0
