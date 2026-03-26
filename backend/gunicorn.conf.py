bind = "0.0.0.0:5000"
workers = 4
worker_class = "sync"
timeout = 90
keepalive = 5
accesslog = "-"
errorlog = "-"
loglevel = "info"
# NO usar preload_app=True — causa deadlock con flask-limiter memory storage (fork-lock issue)
# Restart workers after N requests to prevent memory leaks / stuck workers
max_requests = 100
max_requests_jitter = 20
