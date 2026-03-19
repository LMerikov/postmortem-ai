# Build stage - Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --ci
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

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create data directory for SQLite
RUN mkdir -p /data

# Set environment
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:5000/api/health')" || exit 1

# Start with gunicorn
CMD ["gunicorn", "-c", "gunicorn.conf.py", "app:app"]
