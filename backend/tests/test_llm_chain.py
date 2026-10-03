"""Provider chain: fall through on errors, and report rate limits as 429."""
import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services import llm_service  # noqa: E402
from services.llm_service import RateLimitedError, _call_llm  # noqa: E402


class Fake:
    def __init__(self, name, result):
        self.name, self.model, self.result, self.calls = name, name, result, 0

    def call(self, **_):
        self.calls += 1
        return {"provider": self.name, **self.result}


def limited(seconds):
    return {"content": None, "error": "429", "rate_limited": True, "retry_after": seconds}


def chain(monkeypatch, *providers):
    monkeypatch.setattr(llm_service.ProviderFactory, "get_provider_chain", classmethod(lambda cls: list(providers)))


def test_falls_back_to_second_groq_model_when_first_is_rate_limited(monkeypatch):
    big, small = Fake("gpt-oss-120b", limited(40)), Fake("gpt-oss-20b", {"content": {"title": "ok"}, "error": None})
    chain(monkeypatch, big, small)
    assert _call_llm("s", "u") == {"title": "ok"}
    assert big.calls == small.calls == 1


def test_all_rate_limited_raises_with_shortest_wait(monkeypatch):
    chain(monkeypatch, Fake("a", limited(40)), Fake("b", limited(12)))
    with pytest.raises(RateLimitedError) as exc:
        _call_llm("s", "u")
    assert exc.value.retry_after == 12


def test_non_rate_limit_failure_is_a_regular_error(monkeypatch):
    chain(monkeypatch, Fake("a", limited(40)), Fake("b", {"content": None, "error": "bad json"}))
    with pytest.raises(ValueError):
        _call_llm("s", "u")


def test_analyze_route_returns_429_with_retry_after(tmp_path, monkeypatch):
    import importlib
    monkeypatch.setenv("DATABASE_URL", "")
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "t.db"))
    for name in [m for m in sys.modules if m in ("config", "app") or m.startswith(("models", "routes", "services"))]:
        del sys.modules[name]
    app_module = importlib.import_module("app")
    app_module.limiter.enabled = False

    import routes.analyze as analyze_route

    def boom(_content):
        raise analyze_route.RateLimitedError(17)

    monkeypatch.setattr(analyze_route, "analyze_logs", boom)
    logs = "2026-01-01 ERROR payment-service timeout\n2026-01-01 ERROR checkout 503\n" * 5
    resp = app_module.app.test_client().post(
        "/api/analyze", json={"content": logs}, headers={"X-Client-Id": "alice-0000000000000000"}
    )
    assert resp.status_code == 429
    assert resp.get_json() == {"error": "rate_limited", "retry_after": 17}
    assert resp.headers["Retry-After"] == "17"
