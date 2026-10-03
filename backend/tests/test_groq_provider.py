"""The Groq provider sends the right parameters for each model family."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.providers.groq_provider import GroqProvider  # noqa: E402


class _Resp:
    status_code = 200

    def json(self):
        return {"choices": [{"message": {"content": '{"title": "ok"}'}}], "usage": {}}


def _capture(monkeypatch):
    sent = {}

    def fake_post(url, json=None, headers=None, timeout=None, **_):
        sent.update(json)
        return _Resp()

    monkeypatch.setattr("services.providers.groq_provider.requests.post", fake_post)
    return sent


def test_default_model_is_gpt_oss_with_low_reasoning(monkeypatch):
    sent = _capture(monkeypatch)
    result = GroqProvider("key").call("system", "user")

    assert result["content"] == {"title": "ok"}
    assert sent["model"] == "openai/gpt-oss-120b"
    assert sent["reasoning_effort"] == "low"
    assert sent["include_reasoning"] is False
    assert sent["response_format"] == {"type": "json_object"}


def test_non_reasoning_models_get_no_reasoning_params(monkeypatch):
    sent = _capture(monkeypatch)
    GroqProvider("key", model="llama-3.1-8b-instant").call("system", "user")

    assert "reasoning_effort" not in sent
    assert "include_reasoning" not in sent


def test_free_tier_budget_caps_input_plus_output(monkeypatch):
    from services.providers.groq_provider import _estimate_tokens

    sent = _capture(monkeypatch)
    system = "s" * 13000            # ~ the real analyze system prompt
    huge_logs = "ERROR timeout\n" * 3000
    GroqProvider("key", tpm_limit=8000).call(system, huge_logs, max_tokens=4096)

    user_sent = sent["messages"][1]["content"]
    total = _estimate_tokens(system) + _estimate_tokens(user_sent) + sent["max_tokens"]
    assert total <= 8000
    assert sent["max_tokens"] >= 2500
    assert "recortados" in user_sent


def test_small_input_keeps_requested_output(monkeypatch):
    sent = _capture(monkeypatch)
    GroqProvider("key", tpm_limit=8000).call("short system", "short logs", max_tokens=4096)
    assert sent["max_tokens"] == 4096
    assert sent["messages"][1]["content"] == "short logs"


def test_budget_disabled_on_paid_plans(monkeypatch):
    sent = _capture(monkeypatch)
    huge_logs = "ERROR timeout\n" * 3000
    GroqProvider("key", tpm_limit=0).call("system", huge_logs, max_tokens=4096)
    assert sent["messages"][1]["content"] == huge_logs
