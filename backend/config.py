import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
    DATABASE_PATH = os.getenv("DATABASE_PATH", "postmortems.db")
    DATABASE_URL = os.getenv("DATABASE_URL", "")  # PostgreSQL en producción
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")   # Groq — ultra-rápido (primario)
    GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    CACHE_TTL_HOURS = int(os.getenv("CACHE_TTL_HOURS", "24"))
    MAX_LOG_TOKENS = int(os.getenv("MAX_LOG_TOKENS", "4000"))
    DEBUG = os.getenv("FLASK_ENV", "production") == "development"
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "https://postmortem-ai.xyz").split(",")
        if origin.strip()
    ]
    SECURITY_HEADERS = {
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Content-Security-Policy": (
            "default-src 'self'; "
            "base-uri 'self'; "
            "connect-src 'self'; "
            "font-src 'self' data:; "
            "img-src 'self' data: blob:; "
            "object-src 'none'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline'; "
            "frame-ancestors 'none'; "
            "form-action 'self'"
        ),
    }
