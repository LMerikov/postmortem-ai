# Build stage - Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

# Runtime stage
FROM python:3.11-slim
WORKDIR /app

# Install Node for npm in case needed
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy backend
COPY backend ./backend
COPY deploy ./deploy

WORKDIR /app/backend

# Setup: install dependencies, create directories, and configure non-root user
RUN useradd -m -u 1000 appuser && \
    mkdir -p /data && \
    pip install --no-cache-dir -r requirements.txt && \
    chown -R appuser:appuser /app /data

USER appuser

# Set environment
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 5000

# Health check — start-period largo para dar tiempo a gunicorn+postgres
HEALTHCHECK --interval=10s --timeout=10s --start-period=90s --retries=5 \
  CMD python -c "from urllib.request import urlopen; urlopen('http://localhost:5000/api/health').read()" || exit 1

# Start with gunicorn
CMD ["gunicorn", "-c", "gunicorn.conf.py", "app:app"]
