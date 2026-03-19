import json
import anthropic
from config import Config
from prompts.analyze import ANALYZE_SYSTEM_PROMPT, ANALYZE_USER_PROMPT
from prompts.simulate import SIMULATE_SYSTEM_PROMPT, SIMULATE_USER_PROMPT
from services.log_parser import preprocess


client = anthropic.Anthropic(api_key=Config.ANTHROPIC_API_KEY)


def _call_claude(system: str, user: str, max_tokens: int = 4096) -> dict:
    """Call Claude and parse JSON response. Retries once on JSON parse error."""
    for attempt in range(2):
        message = client.messages.create(
            model=Config.CLAUDE_MODEL,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        raw = message.content[0].text.strip()
        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = re.sub(r"^```[a-z]*\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            if attempt == 1:
                raise ValueError(f"LLM returned invalid JSON after 2 attempts: {raw[:200]}")
    return {}


import re


def analyze_logs(content: str) -> dict:
    """Analyze logs and return postmortem dict."""
    parsed = preprocess(content)
    user_prompt = ANALYZE_USER_PROMPT.format(user_input=parsed["content"])
    return _call_claude(ANALYZE_SYSTEM_PROMPT, user_prompt)


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
    return _call_claude(SIMULATE_SYSTEM_PROMPT, user_prompt, max_tokens=6000)


def analyze_logs_stream(content: str):
    """Generator that yields SSE chunks while streaming from Claude."""
    parsed = preprocess(content)
    user_prompt = ANALYZE_USER_PROMPT.format(user_input=parsed["content"])

    accumulated = ""
    with client.messages.stream(
        model=Config.CLAUDE_MODEL,
        max_tokens=4096,
        system=ANALYZE_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    ) as stream:
        for text in stream.text_stream:
            accumulated += text
            yield json.dumps({"chunk": text, "status": "generating"})

    # Try to parse at the end
    clean = accumulated.strip()
    if clean.startswith("```"):
        clean = re.sub(r"^```[a-z]*\n?", "", clean)
        clean = re.sub(r"\n?```$", "", clean)
    try:
        postmortem = json.loads(clean)
        yield json.dumps({"status": "complete", "postmortem": postmortem})
    except json.JSONDecodeError:
        yield json.dumps({"status": "error", "message": "Failed to parse LLM response"})
