"""Moonshot AI Kimi provider — low-cost alternative to Claude."""
import re
import json
import requests
from .base import LLMProvider


class KimiProvider(LLMProvider):
    """Provider para Moonshot AI Kimi — 90% más económico que Claude."""

    BASE_URL = "https://api.moonshot.cn/v1"
    CHAT_URL = f"{BASE_URL}/chat/completions"

    def __init__(self, api_key: str, model: str = "moonshot-v1-8k"):
        self.api_key = api_key
        self.model = model

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def call(self, system: str, user: str, max_tokens: int = 4096, **kwargs) -> dict:
        try:
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user}
                ],
                "temperature": kwargs.get("temperature", 0.3),
                "max_tokens": min(max_tokens, 8000),
                "response_format": {"type": "json_object"}  # Kimi soporta JSON mode
            }

            resp = requests.post(
                self.CHAT_URL,
                json=payload,
                headers=self._headers(),
                timeout=30
            )

            if resp.status_code != 200:
                err = resp.json().get("error", {}).get("message", resp.text[:200])
                return {'content': None, 'error': f'Kimi API error {resp.status_code}: {err}', 'provider': self.name}

            result = resp.json()
            raw = result["choices"][0]["message"]["content"].strip()

            # Strip markdown fences si los hay
            if raw.startswith("```"):
                raw = re.sub(r"^```[a-z]*\n?", "", raw)
                raw = re.sub(r"\n?```$", "", raw)

            parsed = json.loads(raw)
            usage = result.get("usage", {})

            return {
                'content': parsed,
                'tokens_input': usage.get("prompt_tokens", 0),
                'tokens_output': usage.get("completion_tokens", 0),
                'error': None,
                'provider': self.name
            }
        except requests.Timeout:
            return {'content': None, 'error': 'Kimi API timeout (30s)', 'provider': self.name}
        except json.JSONDecodeError as e:
            return {'content': None, 'error': f'JSON parse error: {e}', 'provider': self.name}
        except Exception as e:
            return {'content': None, 'error': str(e), 'provider': self.name}

    def health_check(self) -> bool:
        """Verifica accesibilidad de la API con timeout corto."""
        try:
            resp = requests.post(
                self.CHAT_URL,
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": "hi"}],
                    "max_tokens": 5
                },
                headers=self._headers(),
                timeout=8
            )
            return resp.status_code in (200, 400)  # 400 = credenciales ok pero bad request
        except Exception:
            return False

    @property
    def name(self) -> str:
        return "kimi"

    @property
    def cost_per_1k_input(self) -> float:
        return 0.0003  # ~$0.30 por 1M tokens (10x más barato que Claude)
