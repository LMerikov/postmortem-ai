"""Anthropic Claude provider."""
import re
import json
import anthropic
from .base import LLMProvider


class AnthropicProvider(LLMProvider):
    """Provider para Anthropic Claude API."""

    def __init__(self, api_key: str, model: str = "claude-sonnet-4-6"):
        # timeout=55s: 2 intentos × 55s = 110s < gunicorn timeout(120s) → workers se liberan
        self.client = anthropic.Anthropic(api_key=api_key, timeout=55.0)
        self.model = model

    def call(self, system: str, user: str, max_tokens: int = 4096, **kwargs) -> dict:
        try:
            msg = self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                system=system,
                messages=[{"role": "user", "content": user}],
            )
            raw = msg.content[0].text.strip()

            # Strip markdown fences si los hay
            if raw.startswith("```"):
                raw = re.sub(r"^```[a-z]*\n?", "", raw)
                raw = re.sub(r"\n?```$", "", raw)

            parsed = json.loads(raw)
            return {
                'content': parsed,
                'tokens_input': msg.usage.input_tokens,
                'tokens_output': msg.usage.output_tokens,
                'error': None,
                'provider': self.name
            }
        except json.JSONDecodeError as e:
            return {'content': None, 'error': f'JSON parse error: {e}', 'provider': self.name}
        except Exception as e:
            return {'content': None, 'error': str(e), 'provider': self.name}

    def stream(self, system: str, user: str, max_tokens: int = 4096):
        """Genera chunks de texto via streaming."""
        with self.client.messages.stream(
            model=self.model,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user}],
        ) as stream:
            for text in stream.text_stream:
                yield text

    def health_check(self) -> bool:
        try:
            self.client.messages.create(
                model=self.model,
                max_tokens=5,
                messages=[{"role": "user", "content": "ping"}]
            )
            return True
        except Exception:
            return False

    @property
    def name(self) -> str:
        return "anthropic"

    @property
    def cost_per_1k_input(self) -> float:
        return 0.003  # ~$3 por 1M tokens input (Claude Sonnet)
