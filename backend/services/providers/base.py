"""Base interface for all LLM providers."""
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any


class LLMProvider(ABC):
    """Interfaz común para todos los providers LLM."""

    @abstractmethod
    def call(
        self,
        system: str,
        user: str,
        max_tokens: int = 4096,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """
        Realiza una llamada al LLM.
        Retorna: {
            'content': dict (parsed JSON),
            'tokens_input': int,
            'tokens_output': int,
            'error': Optional[str]
        }
        """
        pass

    @abstractmethod
    def health_check(self) -> bool:
        """Verifica conectividad y credenciales (llamada rápida)."""
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """Nombre del provider: 'anthropic', 'kimi', etc."""
        pass

    @property
    @abstractmethod
    def cost_per_1k_input(self) -> float:
        """Costo USD por 1k tokens input (para monitoring de costos)."""
        pass
