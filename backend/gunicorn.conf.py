bind = "0.0.0.0:5000"
workers = 4
worker_class = "sync"
timeout = 60
keepalive = 5
accesslog = "-"
errorlog = "-"
loglevel = "info"
# Restart workers after N requests to prevent memory leaks / stuck workers
max_requests = 100
max_requests_jitter = 20
