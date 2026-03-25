"""
LLM Service — Phase 3: Multi-Provider (Kimi primary, Anthropic fallback)
"""
import re
import json
import logging
from config import Config
from prompts.analyze import ANALYZE_SYSTEM_PROMPT, ANALYZE_USER_PROMPT
from prompts.simulate import SIMULATE_SYSTEM_PROMPT, SIMULATE_USER_PROMPT
from services.log_parser import preprocess
from services.providers.factory import ProviderFactory

logger = logging.getLogger(__name__)


def _call_llm(system: str, user: str, max_tokens: int = 4096) -> dict:
    """
    Llama al LLM via provider factory con fallback automático.
    Kimi primario → Anthropic fallback si Kimi falla.
    """
    provider = ProviderFactory.get_primary_provider()

    for attempt in range(2):
        result = provider.call(system=system, user=user, max_tokens=max_tokens)

        if result['error'] is None:
            logger.info(f"LLM call OK via {result.get('provider','?')} | "
                        f"tokens: {result.get('tokens_input',0)} in / {result.get('tokens_output',0)} out")
            return result['content']

        logger.warning(f"Provider {provider.name} error (attempt {attempt+1}): {result['error']}")

        # En primer error, intentar el fallback
        if attempt == 0:
            fallback = ProviderFactory.get_fallback_provider(exclude_name=provider.name)
            if fallback:
                logger.info(f"Switching to fallback provider: {fallback.name}")
                provider = fallback
            else:
                # No hay fallback, reintentar con el mismo
                continue

    raise ValueError(f"All LLM providers failed. Last error: {result['error']}")


def analyze_logs(content: str) -> dict:
    """Analyze logs and return postmortem dict. Uses multi-provider (Phase 3)."""
    parsed = preprocess(content)
    user_prompt = ANALYZE_USER_PROMPT.format(user_input=parsed["content"])
    return _call_llm(ANALYZE_SYSTEM_PROMPT, user_prompt)


def generate_simulation(
    incident_type: str,
    severity: str,
    tech_stack: str,
    infrastructure: str,
    complexity: str,
) -> dict:
    """Generate a simulated incident with logs + postmortem."""
    user_prompt = SIMULATE_USER_PROMPT.format(
        incident_type=incident_type,
        severity=severity,
        tech_stack=tech_stack,
        infrastructure=infrastructure,
        complexity=complexity,
    )
    return _call_llm(SIMULATE_SYSTEM_PROMPT, user_prompt, max_tokens=6000)


def analyze_logs_stream(content: str):
    """
    Generator that yields SSE chunks while streaming from Claude.
    Streaming siempre usa Anthropic (Kimi no tiene streaming API compatible).
    """
    parsed = preprocess(content)
    user_prompt = ANALYZE_USER_PROMPT.format(user_input=parsed["content"])

    # Streaming solo con Anthropic
    anthropic_provider = ProviderFactory.get_anthropic_provider()

    accumulated = ""
    for text in anthropic_provider.stream(
        system=ANALYZE_SYSTEM_PROMPT,
        user=user_prompt,
        max_tokens=4096
    ):
        accumulated += text
        yield json.dumps({"chunk": text, "status": "generating"})

    # Parsear al final
    clean = accumulated.strip()
    if clean.startswith("```"):
        clean = re.sub(r"^```[a-z]*\n?", "", clean)
        clean = re.sub(r"\n?```$", "", clean)
    try:
        postmortem = json.loads(clean)
        yield json.dumps({"status": "complete", "postmortem": postmortem})
    except json.JSONDecodeError:
        yield json.dumps({"status": "error", "message": "Failed to parse LLM response"})
