"""Provider factory con auto-failover Groq → Kimi → Anthropic."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from config import Config
from .anthropic_provider import AnthropicProvider
from .kimi_provider import KimiProvider
from .groq_provider import GroqProvider
from .base import LLMProvider


class ProviderFactory:
    """
    Factory para instanciar y cachear providers LLM.
    Prioridad: Groq (rápido/gratis) → Kimi (barato) → Anthropic (confiable)
    """

    _providers_cache: dict = {}
    _primary_name: str = None

    @classmethod
    def get_primary_provider(cls) -> LLMProvider:
        """
        Retorna el provider primario disponible.
        Prioridad: Groq → Kimi → Anthropic
        """
        # 1. Groq (ultra-rápido, free tier)
        if Config.GROQ_API_KEY:
            if 'groq' not in cls._providers_cache:
                cls._providers_cache['groq'] = GroqProvider(
                    Config.GROQ_API_KEY,
                    model=Config.GROQ_MODEL
                )
            cls._primary_name = 'groq'
            return cls._providers_cache['groq']

        # 2. Kimi (económico)
        if Config.KIMI_API_KEY:
            if 'kimi' not in cls._providers_cache:
                cls._providers_cache['kimi'] = KimiProvider(
                    Config.KIMI_API_KEY,
                    model=getattr(Config, 'KIMI_MODEL', 'moonshot-v1-8k')
                )
            cls._primary_name = 'kimi'
            return cls._providers_cache['kimi']

        # 3. Anthropic (fallback confiable)
        if Config.ANTHROPIC_API_KEY:
            if 'anthropic' not in cls._providers_cache:
                cls._providers_cache['anthropic'] = AnthropicProvider(
                    Config.ANTHROPIC_API_KEY,
                    model=Config.CLAUDE_MODEL
                )
            cls._primary_name = 'anthropic'
            return cls._providers_cache['anthropic']

        raise RuntimeError("No LLM providers disponibles. Configura GROQ_API_KEY, KIMI_API_KEY o ANTHROPIC_API_KEY.")

    @classmethod
    def get_fallback_provider(cls, exclude_name: str) -> LLMProvider:
        """Retorna un provider alternativo para fallback en errores."""
        for name in ['groq', 'kimi', 'anthropic']:
            if name == exclude_name:
                continue
            if name == 'groq' and Config.GROQ_API_KEY:
                if 'groq' not in cls._providers_cache:
                    cls._providers_cache['groq'] = GroqProvider(Config.GROQ_API_KEY, Config.GROQ_MODEL)
                return cls._providers_cache['groq']
            if name == 'kimi' and Config.KIMI_API_KEY:
                if 'kimi' not in cls._providers_cache:
                    cls._providers_cache['kimi'] = KimiProvider(Config.KIMI_API_KEY)
                return cls._providers_cache['kimi']
            if name == 'anthropic' and Config.ANTHROPIC_API_KEY:
                if 'anthropic' not in cls._providers_cache:
                    cls._providers_cache['anthropic'] = AnthropicProvider(
                        Config.ANTHROPIC_API_KEY, Config.CLAUDE_MODEL)
                return cls._providers_cache['anthropic']
        return None

    @classmethod
    def get_anthropic_provider(cls) -> AnthropicProvider:
        """Retorna siempre el provider Anthropic (para streaming)."""
        if 'anthropic' not in cls._providers_cache:
            cls._providers_cache['anthropic'] = AnthropicProvider(
                Config.ANTHROPIC_API_KEY,
                model=Config.CLAUDE_MODEL
            )
        return cls._providers_cache['anthropic']

    @classmethod
    def reset_cache(cls):
        """Limpia el cache de providers (útil en tests)."""
        cls._providers_cache = {}
        cls._primary_name = None
