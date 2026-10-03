"""Groq provider — GPT-OSS 120B por defecto (rápido, JSON fiable, precio publicado)."""
import re
import json
import math
import requests
from .base import LLMProvider


# Estimación conservadora: ~3,2 caracteres por token en logs y prompts mixtos ES/EN.
_CHARS_PER_TOKEN = 3.2
# Mínimo de tokens de salida para que quepa un postmortem completo.
_MIN_COMPLETION = 2500
_SAFETY_MARGIN = 300


def _retry_after_seconds(value) -> int:
    """Groq envía retry-after en segundos (puede traer decimales). Por defecto 60."""
    try:
        return max(1, math.ceil(float(value)))
    except (TypeError, ValueError):
        return 60


def _estimate_tokens(text: str) -> int:
    return int(len(text) / _CHARS_PER_TOKEN) + 1


class GroqProvider(LLMProvider):
    """Provider para Groq — ~500 tok/s, free tier generoso."""

    BASE_URL = "https://api.groq.com/openai/v1"
    CHAT_URL = f"{BASE_URL}/chat/completions"

    DEFAULT_MODEL = "openai/gpt-oss-120b"

    def __init__(self, api_key: str, model: str = DEFAULT_MODEL, tpm_limit: int = 8000):
        self.api_key = api_key
        self.model = model
        # Límite de tokens por minuto del plan. El plan gratuito de Groq es 8K y
        # rechaza la petición entera si entrada + max_tokens lo supera. 0 = sin límite.
        self.tpm_limit = tpm_limit

    def _fit_budget(self, system: str, user: str, max_tokens: int) -> tuple[str, int]:
        """Ajusta max_tokens y, si hace falta, recorta el mensaje del usuario para
        que entrada + salida quepan en el límite de tokens por minuto."""
        if not self.tpm_limit:
            return user, max_tokens

        budget = self.tpm_limit - _SAFETY_MARGIN
        available_for_user = budget - _estimate_tokens(system) - _MIN_COMPLETION
        if _estimate_tokens(user) > available_for_user:
            keep = max(int(available_for_user * _CHARS_PER_TOKEN), 1000)
            head, tail = user[: keep * 2 // 3], user[-(keep // 3):]
            user = f"{head}\n\n[... logs recortados para el límite del plan ...]\n\n{tail}"

        remaining = budget - _estimate_tokens(system) - _estimate_tokens(user)
        return user, max(min(max_tokens, remaining), _MIN_COMPLETION)

    def _model_params(self) -> dict:
        """Parámetros específicos del modelo.

        Los modelos GPT-OSS razonan antes de responder. Con esfuerzo bajo y sin
        devolver el razonamiento, el contenido es solo el JSON y la latencia se
        mantiene en pocos segundos.
        """
        if self.model.startswith("openai/gpt-oss"):
            return {"reasoning_effort": "low", "include_reasoning": False}
        return {}

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def call(self, system: str, user: str, max_tokens: int = 4096, **kwargs) -> dict:
        try:
            user, max_tokens = self._fit_budget(system, user, max_tokens)
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user}
                ],
                "temperature": kwargs.get("temperature", 0.3),
                "max_tokens": min(max_tokens, 8000),
                "response_format": {"type": "json_object"},
                **self._model_params(),
            }

            resp = requests.post(
                self.CHAT_URL,
                json=payload,
                headers=self._headers(),
                timeout=(5, 25)  # (connect_timeout, read_timeout) — falla rápido si Groq no responde
            )

            if resp.status_code in (413, 429):
                return {
                    'content': None,
                    'error': f'Groq rate limit ({resp.status_code}) on {self.model}',
                    'rate_limited': True,
                    'retry_after': _retry_after_seconds(resp.headers.get('retry-after')),
                    'provider': self.name,
                }

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
            user, max_tokens = self._fit_budget(system, user, max_tokens)
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user}
                ],
                "temperature": kwargs.get("temperature", 0.3),
                "max_tokens": min(max_tokens, 8000),
                "stream": True,
                **self._model_params(),
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
        return 0.00015  # GPT-OSS 120B: $0.15 por 1M tokens de entrada
