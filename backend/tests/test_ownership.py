"""
Each browser (X-Client-Id) only sees, deletes and reuses its own postmortems.
Runs against a temporary SQLite database; the LLM is never called.
"""
import importlib
import os
import sys

import pytest

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

ALICE = {"X-Client-Id": "alice-0000000000000000"}
BOB = {"X-Client-Id": "bob-00000000000000000000"}

PM = {"title": "Payment outage", "severity": "P1", "summary": "Stripe timeouts exhausted the pool."}


@pytest.fixture
def app_ctx(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "")
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "test.db"))
    for name in [m for m in sys.modules if m in ("config", "app") or m.startswith(("models", "routes", "services"))]:
        del sys.modules[name]
    app_module = importlib.import_module("app")
    app_module.app.config["TESTING"] = True
    app_module.limiter.enabled = False
    from models.postmortem import save_postmortem
    from services.cache_service import find_in_cache, save_to_cache
    from services.owner import HEADER  # noqa: F401
    return app_module.app.test_client(), save_postmortem, find_in_cache, save_to_cache


def _hash(headers):
    import hashlib
    return hashlib.sha256(headers["X-Client-Id"].encode()).hexdigest()


def test_history_only_lists_own_postmortems(app_ctx):
    client, save, _, _ = app_ctx
    save(PM, owner_hash=_hash(ALICE))
    save({**PM, "title": "Bob incident"}, owner_hash=_hash(BOB))

    alice = client.get("/api/postmortems", headers=ALICE).get_json()
    assert [p["title"] for p in alice] == ["Payment outage"]
    assert client.get("/api/postmortems").get_json() == []


def test_history_items_carry_a_compact_timeline_only(app_ctx):
    client, save, _, _ = app_ctx
    save({**PM, "root_cause": "x" * 500, "timeline": [
        {"time": "03:10:13", "type": "warning", "event": "long text that must not ship"},
        {"time": "03:10:20", "type": "error", "event": "another"},
    ]}, owner_hash=_hash(ALICE))
    item = client.get("/api/postmortems", headers=ALICE).get_json()[0]
    assert item["timeline"] == [{"time": "03:10:13", "type": "warning"}, {"time": "03:10:20", "type": "error"}]
    assert "data" not in item and "root_cause" not in item


def test_cannot_delete_someone_elses_postmortem(app_ctx):
    client, save, _, _ = app_ctx
    pm_id = save(PM, owner_hash=_hash(ALICE))

    assert client.delete(f"/api/postmortems/{pm_id}", headers=BOB).status_code == 404
    assert client.delete(f"/api/postmortems/{pm_id}").status_code == 404
    assert client.delete(f"/api/postmortems/{pm_id}", headers=ALICE).status_code == 200


def test_shared_link_does_not_expose_owner(app_ctx):
    client, save, _, _ = app_ctx
    pm_id = save(PM, owner_hash=_hash(ALICE))
    body = client.get(f"/api/postmortems/{pm_id}").get_json()
    assert body["title"] == "Payment outage"
    assert "owner_hash" not in body


def test_invalid_client_id_is_treated_as_anonymous(app_ctx):
    client, save, _, _ = app_ctx
    save(PM, owner_hash=_hash(ALICE))
    assert client.get("/api/postmortems", headers={"X-Client-Id": "short"}).get_json() == []


def test_similarity_cache_is_isolated_per_owner(app_ctx):
    _, _, find, store = app_ctx
    logs = "error payment-service stripe timeout pool exhausted connection refused retry"
    store(logs, PM, _hash(ALICE))

    assert find(logs, _hash(ALICE)) is not None
    assert find(logs, _hash(BOB)) is None
    assert find(logs, None) is None


def test_migrates_existing_database_without_owner_column(tmp_path, monkeypatch):
    import sqlite3
    db = tmp_path / "legacy.db"
    conn = sqlite3.connect(db)
    conn.execute("""CREATE TABLE postmortems (id TEXT PRIMARY KEY, title TEXT NOT NULL, severity TEXT NOT NULL,
                    summary TEXT, data TEXT NOT NULL, source TEXT DEFAULT 'analyze', created_at TEXT NOT NULL)""")
    conn.execute("""CREATE TABLE postmortem_cache (id INTEGER PRIMARY KEY AUTOINCREMENT, content_hash TEXT UNIQUE NOT NULL,
                    normalized_content TEXT NOT NULL, keywords TEXT NOT NULL, postmortem_json TEXT NOT NULL,
                    hit_count INTEGER DEFAULT 1, created_at TEXT NOT NULL, last_used_at TEXT NOT NULL)""")
    conn.execute("INSERT INTO postmortems VALUES ('old', 'Legacy', 'P2', '', '{}', 'analyze', '2026-01-01')")
    conn.commit()
    conn.close()

    monkeypatch.setenv("DATABASE_URL", "")
    monkeypatch.setenv("DATABASE_PATH", str(db))
    for name in [m for m in sys.modules if m in ("config", "app") or m.startswith(("models", "routes", "services"))]:
        del sys.modules[name]
    app_module = importlib.import_module("app")
    client = app_module.app.test_client()

    cols = {r[1] for r in sqlite3.connect(db).execute("PRAGMA table_info(postmortems)")}
    assert "owner_hash" in cols
    # Legacy rows have no owner: still reachable by link, never listed or deletable.
    assert client.get("/api/postmortems/old").status_code == 200
    assert client.get("/api/postmortems", headers=ALICE).get_json() == []
    assert client.delete("/api/postmortems/old", headers=ALICE).status_code == 404


def test_dashboard_only_counts_own_postmortems(app_ctx):
    client, save, _, _ = app_ctx
    save({**PM, "severity": "P0"}, owner_hash=_hash(ALICE))
    save({**PM, "severity": "P2"}, owner_hash=_hash(ALICE))
    save({**PM, "severity": "P0"}, owner_hash=_hash(BOB))

    alice = client.get("/api/dashboard", headers=ALICE).get_json()
    assert alice["total_postmortems"] == 2
    assert alice["severity_distribution"]["P0"] == 1
    assert alice["severity_distribution"]["P2"] == 1

    assert client.get("/api/dashboard", headers=BOB).get_json()["total_postmortems"] == 1
    assert client.get("/api/dashboard").get_json()["total_postmortems"] == 0
