"""Provider factory con auto-failover Kimi → Anthropic."""
import os
import sys

# Importar config (navegando al directorio padre)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from config import Config
from .anthropic_provider import AnthropicProvider
from .kimi_provider import KimiProvider
from .base import LLMProvider


class ProviderFactory:
    """
    Factory para instanciar y cachear providers LLM.
    Prioridad: Kimi (barato) → Anthropic (confiable fallback)
    """

    _providers_cache: dict = {}
    _primary_name: str = None  # Track qué provider está activo

    @classmethod
    def get_primary_provider(cls) -> LLMProvider:
        """
        Retorna el provider primario disponible.
        Intentar Kimi primero si KIMI_API_KEY está configurado, sino Anthropic.
        NO hace health_check en cada call (muy lento) — usa cache.
        """
        # Intentar Kimi si hay API key
        if Config.KIMI_API_KEY:
            if 'kimi' not in cls._providers_cache:
                try:
                    cls._providers_cache['kimi'] = KimiProvider(
                        Config.KIMI_API_KEY,
                        model=getattr(Config, 'KIMI_MODEL', 'moonshot-v1-8k')
                    )
                except Exception:
                    pass

            if 'kimi' in cls._providers_cache:
                cls._primary_name = 'kimi'
                return cls._providers_cache['kimi']

        # Fallback a Anthropic
        if Config.ANTHROPIC_API_KEY:
            if 'anthropic' not in cls._providers_cache:
                try:
                    cls._providers_cache['anthropic'] = AnthropicProvider(
                        Config.ANTHROPIC_API_KEY,
                        model=Config.CLAUDE_MODEL
                    )
                except Exception:
                    pass

            if 'anthropic' in cls._providers_cache:
                cls._primary_name = 'anthropic'
                return cls._providers_cache['anthropic']

        raise RuntimeError("No LLM providers available. Configure ANTHROPIC_API_KEY o KIMI_API_KEY.")

    @classmethod
    def get_fallback_provider(cls, exclude_name: str) -> LLMProvider:
        """Retorna un provider alternativo (para fallback en errores)."""
        for name in ['kimi', 'anthropic']:
            if name == exclude_name:
                continue
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
        """Retorna siempre el provider Anthropic (para streaming que solo Anthropic soporta)."""
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
