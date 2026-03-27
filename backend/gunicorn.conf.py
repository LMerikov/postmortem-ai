bind = "0.0.0.0:5000"
workers = 8
worker_class = "sync"
timeout = 60           # matar worker si tarda +60s (Groq max ~30s + margen)
graceful_timeout = 30  # dar 30s para terminar requests activos antes de kill
keepalive = 5
accesslog = "-"
errorlog = "-"
loglevel = "info"
# NO usar preload_app=True — causa deadlock con flask-limiter memory storage (fork-lock issue)
# Restart workers after N requests to prevent memory leaks / stuck workers
max_requests = 50
max_requests_jitter = 10
