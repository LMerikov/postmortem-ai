import sqlite3
import json
import uuid
from datetime import datetime
from config import Config


def get_db():
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute("""
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
    conn.close()


def save_postmortem(postmortem_data: dict, source: str = "analyze") -> str:
    postmortem_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    conn = get_db()
    conn.execute(
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
    conn.close()
    return postmortem_id


def get_all_postmortems():
    conn = get_db()
    rows = conn.execute(
        "SELECT id, title, severity, summary, source, created_at FROM postmortems ORDER BY created_at DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_postmortem_by_id(postmortem_id: str):
    conn = get_db()
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
    cursor = conn.execute("DELETE FROM postmortems WHERE id = ?", (postmortem_id,))
    conn.commit()
    conn.close()
    return cursor.rowcount > 0
