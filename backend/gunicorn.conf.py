bind = "0.0.0.0:5000"
workers = 2              # VPS 4GB: 2 workers × ~460MB = 920MB (deja RAM para Dokploy+OS)
worker_class = "sync"
timeout = 120            # LLM puede tardar 30-60s (Groq ~5s, Claude fallback ~30s + margen)
graceful_timeout = 30    # dar 30s para terminar requests activos antes de kill
keepalive = 5
accesslog = "-"
errorlog = "-"
loglevel = "info"
# NO usar preload_app=True — causa deadlock con flask-limiter memory storage (fork-lock issue)
# Restart workers periodicamente para prevenir memory leaks
max_requests = 500       # era 50 — health checks (6/min) agotaban esto en ~8 min
max_requests_jitter = 50
