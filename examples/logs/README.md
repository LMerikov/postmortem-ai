# Logs de ejemplo

Incidentes ficticios para probar Postmortem.ai de punta a punta. Ningún dato es real.

| Archivo | Incidente | Causa raíz esperada |
|---------|-----------|---------------------|
| `01-db-pool-exhausted.log` | Checkout con errores 500 | Job de reportes agota las conexiones de PostgreSQL |
| `02-memory-leak-oomkilled.log` | Búsqueda caída tras un deploy | Caché sin expulsión en v3.8.0 provoca OOMKilled |
| `03-tls-certificate-expired.log` | API inaccesible por TLS | Renovación fallida: permiso IAM de Route53 eliminado por Terraform |
| `04-total-outage-data-loss.log` | Caída total y pérdida de pedidos (P0) | Migración destructiva ejecutada contra producción |

Úsalos con **Abrir archivo** en la interfaz, o con `scripts/e2e.py` (ver la cabecera del script).
