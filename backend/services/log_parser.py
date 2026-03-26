import re


def detect_format(content: str) -> str:
    """Detect log format: syslog, json, stacktrace, or text."""
    content_lower = content.lower()
    if re.search(r'^\s*\{', content, re.MULTILINE) and '"level"' in content_lower:
        return "json"
    if re.search(r'(traceback|at \w+\.\w+\(|exception in thread|caused by:)', content_lower):
        return "stacktrace"
    if re.search(r'\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}', content):
        return "syslog"
    return "text"


def truncate_logs(content: str, max_chars: int = 12000) -> str:
    """Keep start + end + error lines if content is too large."""
    if len(content) <= max_chars:
        return content

    lines = content.splitlines()
    error_lines = [
        line for line in lines
        if re.search(r'\b(error|fatal|critical|exception|traceback|panic)\b', line, re.IGNORECASE)
    ]

    start = "\n".join(lines[:50])
    end = "\n".join(lines[-50:])
    errors = "\n".join(error_lines[:100])

    return (
        f"{start}\n\n[... logs truncated for context ...]\n\n"
        f"=== ERROR LINES ===\n{errors}\n\n"
        f"=== END OF LOG ===\n{end}"
    )


def preprocess(content: str) -> dict:
    """Pre-process log content and return enriched metadata."""
    fmt = detect_format(content)
    truncated = truncate_logs(content)

    timestamps = re.findall(r'\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}', truncated)
    error_count = len(re.findall(r'\b(ERROR|FATAL|CRITICAL)\b', truncated, re.IGNORECASE))
    warn_count = len(re.findall(r'\b(WARN|WARNING)\b', truncated, re.IGNORECASE))
    services = list(set(re.findall(r'service[:\s]+([a-zA-Z0-9_-]+)', truncated, re.IGNORECASE)))

    return {
        "content": truncated,
        "format": fmt,
        "timestamps": timestamps[:5],
        "error_count": error_count,
        "warn_count": warn_count,
        "services": services[:10],
        "original_length": len(content),
    }
