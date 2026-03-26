"""Groq provider — ultra-rápido con Llama-3.3-70b (~3-5s por postmortem)."""
import re
import json
import requests
from .base import LLMProvider


class GroqProvider(LLMProvider):
    """Provider para Groq — ~500 tok/s, free tier generoso."""

    BASE_URL = "https://api.groq.com/openai/v1"
    CHAT_URL = f"{BASE_URL}/chat/completions"

    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile"):
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
                "response_format": {"type": "json_object"}
            }

            resp = requests.post(
                self.CHAT_URL,
                json=payload,
                headers=self._headers(),
                timeout=30
            )

            if resp.status_code != 200:
                err = resp.json().get("error", {}).get("message", resp.text[:200])
                return {'content': None, 'error': f'Groq API error {resp.status_code}: {err}', 'provider': self.name}

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
            return {'content': None, 'error': 'Groq API timeout (30s)', 'provider': self.name}
        except json.JSONDecodeError as e:
            return {'content': None, 'error': f'JSON parse error: {e}', 'provider': self.name}
        except Exception as e:
            return {'content': None, 'error': str(e), 'provider': self.name}

    def stream(self, system: str, user: str, max_tokens: int = 4096, **kwargs):
        """Stream text completions from Groq (OpenAI-compatible API)."""
        try:
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user}
                ],
                "temperature": kwargs.get("temperature", 0.3),
                "max_tokens": min(max_tokens, 8000),
                "stream": True
            }

            resp = requests.post(
                self.CHAT_URL,
                json=payload,
                headers=self._headers(),
                timeout=60,
                stream=True
            )

            if resp.status_code != 200:
                yield f"error: {resp.text[:200]}"
                return

            for line in resp.iter_lines():
                if not line:
                    continue
                if isinstance(line, bytes):
                    line = line.decode('utf-8')
                if line.startswith('data: '):
                    try:
                        chunk_data = json.loads(line[6:])
                        if 'choices' in chunk_data and chunk_data['choices']:
                            delta = chunk_data['choices'][0].get('delta', {})
                            content = delta.get('content', '')
                            if content:
                                yield content
                    except json.JSONDecodeError:
                        pass
        except requests.Timeout:
            yield "error: Groq API timeout (60s)"
        except Exception as e:
            yield f"error: {str(e)}"

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
            return resp.status_code in (200, 400)
        except Exception:
            return False

    @property
    def name(self) -> str:
        return "groq"

    @property
    def cost_per_1k_input(self) -> float:
        return 0.00059  # ~$0.59 por 1M tokens
