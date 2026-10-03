#!/usr/bin/env python3
"""
End-to-end test against a running backend with a real LLM key.

    cd backend && PORT=5050 venv/bin/python app.py      # in one terminal
    backend/venv/bin/python scripts/e2e.py              # in another

For each file in examples/logs/ it analyzes the logs, validates the postmortem,
checks history isolation between two anonymous clients, exports PDF and
Markdown, and deletes the result. Exits non-zero on the first failure.
"""
import os
import sys
import time
import uuid
from pathlib import Path

import requests

API = os.getenv("API", "http://127.0.0.1:5050")
ROOT = Path(__file__).resolve().parent.parent
LOGS = sorted((ROOT / "examples" / "logs").glob("*.log"))

REQUIRED = ["title", "severity", "summary", "timeline", "root_cause", "impact", "action_items"]
SEVERITIES = {"P0", "P1", "P2", "P3", "P4"}


def client():
    return {"X-Client-Id": str(uuid.uuid4())}


def check(cond, msg):
    if not cond:
        print(f"  FAIL  {msg}")
        sys.exit(1)
    print(f"  ok    {msg}")


def main():
    try:
        health = requests.get(f"{API}/api/health", timeout=5).json()
    except requests.RequestException as e:
        print(f"Backend not reachable at {API}: {e}")
        sys.exit(1)
    print(f"Backend {API} · {health}\n")

    alice, bob = client(), client()
    durations = []

    for log in LOGS:
        print(f"▶ {log.name}")
        start = time.monotonic()
        resp = requests.post(f"{API}/api/analyze", json={"content": log.read_text()}, headers=alice, timeout=120)
        elapsed = time.monotonic() - start
        durations.append(elapsed)
        check(resp.status_code == 200, f"analyze → 200 in {elapsed:.1f}s (got {resp.status_code}: {resp.text[:200]})")

        body = resp.json()
        pm, pm_id = body["postmortem"], body["id"]
        print(f"        source={body.get('_source')} · {pm.get('severity')} · {pm.get('title')}")
        missing = [k for k in REQUIRED if not pm.get(k)]
        check(not missing, f"postmortem has {', '.join(REQUIRED)} (missing: {missing})")
        check(pm["severity"] in SEVERITIES, f"severity is P0–P4 ({pm['severity']})")
        check(len(pm["timeline"]) >= 3, f"timeline has ≥3 events ({len(pm['timeline'])})")

        mine = [p["id"] for p in requests.get(f"{API}/api/postmortems", headers=alice, timeout=10).json()]
        theirs = [p["id"] for p in requests.get(f"{API}/api/postmortems", headers=bob, timeout=10).json()]
        check(pm_id in mine, "appears in the owner's history")
        check(pm_id not in theirs, "hidden from another client's history")
        check(requests.get(f"{API}/api/postmortems/{pm_id}", timeout=10).status_code == 200, "opens by shared link")

        md = requests.post(f"{API}/api/export/markdown", json={"postmortem": pm}, timeout=30)
        check(md.status_code == 200 and pm["title"][:20] in md.text, "Markdown export")
        pdf = requests.post(f"{API}/api/export/pdf", json={"postmortem": pm, "timezone": "America/Santiago"}, timeout=60)
        check(pdf.status_code == 200 and pdf.content[:4] == b"%PDF", f"PDF export ({len(pdf.content) // 1024} KB)")

        check(requests.delete(f"{API}/api/postmortems/{pm_id}", headers=bob, timeout=10).status_code == 404,
              "another client cannot delete it")
        check(requests.delete(f"{API}/api/postmortems/{pm_id}", headers=alice, timeout=10).status_code == 200,
              "owner deletes it")
        print()

    print(f"All {len(LOGS)} incidents passed · analyze time avg {sum(durations) / len(durations):.1f}s, "
          f"max {max(durations):.1f}s")


if __name__ == "__main__":
    main()
