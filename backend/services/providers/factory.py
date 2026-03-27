"""Provider factory: Groq (primario, rápido) → Anthropic (fallback confiable)."""
import os
import sys
from typing import Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from config import Config
from .anthropic_provider import AnthropicProvider
from .groq_provider import GroqProvider
from .base import LLMProvider


class ProviderFactory:
    """
    Factory para instanciar y cachear providers LLM.
    Prioridad: Groq (rápido/gratis) → Anthropic (confiable fallback)
    """

    _providers_cache: dict = {}
    _primary_name: Optional[str] = None

    @classmethod
    def get_primary_provider(cls) -> LLMProvider:
        """Retorna Groq si está disponible, sino Anthropic."""
        if Config.GROQ_API_KEY:
            if 'groq' not in cls._providers_cache:
                cls._providers_cache['groq'] = GroqProvider(
                    Config.GROQ_API_KEY, model=Config.GROQ_MODEL
                )
            cls._primary_name = 'groq'
            return cls._providers_cache['groq']

        if Config.ANTHROPIC_API_KEY:
            if 'anthropic' not in cls._providers_cache:
                cls._providers_cache['anthropic'] = AnthropicProvider(
                    Config.ANTHROPIC_API_KEY, model=Config.CLAUDE_MODEL
                )
            cls._primary_name = 'anthropic'
            return cls._providers_cache['anthropic']

        raise RuntimeError("No LLM providers disponibles. Configura GROQ_API_KEY o ANTHROPIC_API_KEY.")

    @classmethod
    def get_fallback_provider(cls, exclude_name: str) -> LLMProvider:
        """Retorna Anthropic como fallback si Groq falla."""
        if exclude_name != 'anthropic' and Config.ANTHROPIC_API_KEY:
            if 'anthropic' not in cls._providers_cache:
                cls._providers_cache['anthropic'] = AnthropicProvider(
                    Config.ANTHROPIC_API_KEY, Config.CLAUDE_MODEL
                )
            return cls._providers_cache['anthropic']
        return None

    @classmethod
    def get_anthropic_provider(cls) -> AnthropicProvider:
        """Retorna siempre el provider Anthropic (para streaming)."""
        if 'anthropic' not in cls._providers_cache:
            cls._providers_cache['anthropic'] = AnthropicProvider(
                Config.ANTHROPIC_API_KEY, model=Config.CLAUDE_MODEL
            )
        return cls._providers_cache['anthropic']

    @classmethod
    def reset_cache(cls):
        cls._providers_cache = {}
        cls._primary_name = None
