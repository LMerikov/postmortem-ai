"""
LLM Service — Phase 3: Multi-Provider (Groq primary, Anthropic fallback)
"""
import re
import json
import logging
from config import Config
from prompts.analyze import ANALYZE_SYSTEM_PROMPT, ANALYZE_USER_PROMPT
from services.log_parser import preprocess
from services.providers.factory import ProviderFactory

logger = logging.getLogger(__name__)

MARKDOWN_CODE_BLOCK_START = r"^```[a-z]*\n?"
MARKDOWN_CODE_BLOCK_END = r"\n?```$"


class RateLimitedError(Exception):
    """Todos los proveedores rechazaron la petición por límite de uso."""

    def __init__(self, retry_after: int):
        super().__init__(f"All LLM providers are rate limited; retry after {retry_after}s")
        self.retry_after = retry_after


def _call_llm(system: str, user: str, max_tokens: int = 4096) -> dict:
    """
    Recorre la cadena de proveedores hasta que uno responda:
    Groq principal → Groq secundario → Anthropic.
    Si todos fallan por límite de uso, lanza RateLimitedError con la espera mínima.
    """
    errors = []
    retry_afters = []

    for provider in ProviderFactory.get_provider_chain():
        result = provider.call(system=system, user=user, max_tokens=max_tokens)

        if result['error'] is None:
            logger.info(f"LLM call OK via {result.get('provider','?')} ({getattr(provider, 'model', '')}) | "
                        f"tokens: {result.get('tokens_input',0)} in / {result.get('tokens_output',0)} out")
            return result['content']

        logger.warning(f"Provider {provider.name} error: {result['error']}")
        errors.append(result['error'])
        if result.get('rate_limited'):
            retry_afters.append(result.get('retry_after', 60))

    if retry_afters and len(retry_afters) == len(errors):
        raise RateLimitedError(min(retry_afters))
    raise ValueError(f"All LLM providers failed: {' | '.join(errors)}")


def analyze_logs(content: str) -> dict:
    """Analyze logs and return postmortem dict. Uses multi-provider (Phase 3)."""
    parsed = preprocess(content)
    user_prompt = ANALYZE_USER_PROMPT.format(user_input=parsed["content"])
    raw = _call_llm(ANALYZE_SYSTEM_PROMPT, user_prompt)
    if isinstance(raw, str):
        clean = raw.strip()
        if clean.startswith("```"):
            clean = re.sub(MARKDOWN_CODE_BLOCK_START, "", clean)
            clean = re.sub(MARKDOWN_CODE_BLOCK_END, "", clean)
        return json.loads(clean)
    return raw


def analyze_logs_stream(content: str):
    """
    Generator que streamea desde Groq (primario, ~500 tok/s).
    Si Groq falla → fallback a Anthropic.
    """
    parsed = preprocess(content)
    user_prompt = ANALYZE_USER_PROMPT.format(user_input=parsed["content"])

    provider = ProviderFactory.get_primary_provider()
    accumulated = ""
    error_msg = None

    try:
        for text in provider.stream(
            system=ANALYZE_SYSTEM_PROMPT,
            user=user_prompt,
            max_tokens=4096
        ):
            if text.startswith("error: "):
                error_msg = text[7:]
                break
            accumulated += text
            yield json.dumps({"chunk": text, "status": "generating"})
    except Exception as e:
        error_msg = str(e)
        logger.warning(f"Stream error from {provider.name}: {error_msg}")

    if error_msg and provider.name != "anthropic":
        logger.info("Switching to Anthropic fallback for streaming")
        yield json.dumps({"status": "restarting", "message": "Provider failed, switching to fallback..."})
        anthropic_provider = ProviderFactory.get_anthropic_provider()
        accumulated = ""
        try:
            for text in anthropic_provider.stream(
                system=ANALYZE_SYSTEM_PROMPT,
                user=user_prompt,
                max_tokens=4096
            ):
                accumulated += text
                yield json.dumps({"chunk": text, "status": "generating"})
        except Exception as e:
            yield json.dumps({"status": "error", "message": f"Fallback provider failed: {str(e)}"})
            return

    clean = accumulated.strip()
    if clean.startswith("```"):
        clean = re.sub(MARKDOWN_CODE_BLOCK_START, "", clean)
        clean = re.sub(MARKDOWN_CODE_BLOCK_END, "", clean)
    try:
        postmortem = json.loads(clean)
        yield json.dumps({"status": "complete", "postmortem": postmortem})
    except json.JSONDecodeError as e:
        yield json.dumps({"status": "error", "message": f"JSON parse error: {str(e)}"})
