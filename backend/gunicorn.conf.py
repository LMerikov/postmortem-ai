bind = "0.0.0.0:5000"
workers = 8
worker_class = "sync"
timeout = 90
keepalive = 5
accesslog = "-"
errorlog = "-"
loglevel = "info"
# Cargar la app en el master process — evita init_db() por worker
preload_app = True
# Restart workers after N requests to prevent memory leaks / stuck workers
max_requests = 100
max_requests_jitter = 20
