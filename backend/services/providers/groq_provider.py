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
                timeout=(5, 25)  # (connect_timeout, read_timeout) — falla rápido si Groq no responde
            )

            if resp.status_code == 429:
                return {'content': None, 'error': 'Groq rate limit (429) — switching to fallback', 'provider': self.name}

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
            return {'content': None, 'error': 'Groq API timeout (25s) — switching to fallback', 'provider': self.name}
        except json.JSONDecodeError as e:
            return {'content': None, 'error': f'JSON parse error: {e}', 'provider': self.name}
        except Exception as e:
            return {'content': None, 'error': str(e), 'provider': self.name}

    def _decode_line(self, line) -> str:
        """Decodifica una línea de bytes/str a str."""
        if isinstance(line, bytes):
            return line.decode('utf-8')
        return line

    def _parse_sse_chunk(self, line: str):
        """Parsea una línea SSE y retorna el contenido del delta, o None."""
        if not line.startswith('data: '):
            return None
        try:
            chunk_data = json.loads(line[6:])
            if chunk_data.get('choices'):
                delta = chunk_data['choices'][0].get('delta', {})
                return delta.get('content') or None
        except json.JSONDecodeError:
            pass
        return None

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

            for raw_line in resp.iter_lines():
                if not raw_line:
                    continue
                content = self._parse_sse_chunk(self._decode_line(raw_line))
                if content:
                    yield content

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
