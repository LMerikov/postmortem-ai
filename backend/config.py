import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
    DATABASE_PATH = os.getenv("DATABASE_PATH", "postmortems.db")
    DATABASE_URL = os.getenv("DATABASE_URL", "")  # PostgreSQL en producción
    KIMI_API_KEY = os.getenv("KIMI_API_KEY", "")   # Moonshot AI (Phase 3)
    KIMI_MODEL = os.getenv("KIMI_MODEL", "moonshot-v1-8k")
    CACHE_TTL_HOURS = int(os.getenv("CACHE_TTL_HOURS", "24"))
    MAX_LOG_TOKENS = int(os.getenv("MAX_LOG_TOKENS", "4000"))
    DEBUG = os.getenv("FLASK_ENV", "production") == "development"
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "https://postmortem-ai.xyz")
