#!/bin/bash
set -e

echo "🚀 Iniciando Postmortem.ai..."

# Backend - Python
cd backend
echo "📦 Instalando dependencias del backend..."
pip install -r requirements.txt

# Frontend - Node
cd ../frontend
echo "📦 Instalando dependencias del frontend..."
npm install --ci
npm run build

# Volver a backend
cd ../backend
echo "✅ Build completado. Iniciando servidor..."

# Crear carpeta de BD si no existe
mkdir -p /data

# Iniciar con Gunicorn
exec gunicorn -c gunicorn.conf.py app:app
