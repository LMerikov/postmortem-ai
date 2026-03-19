# 🔥 Postmortem.ia

> De logs caóticos a postmortems profesionales en segundos.

**Postmortem.ai** es una plataforma impulsada por IA que genera documentos de postmortem profesionales a partir de logs de servidor, stacktraces o descripciones de incidentes. Incluye un **Modo Simulación** para entrenar equipos DevOps y SRE con incidentes ficticios realistas.

🌐 **Demo:** [https://postmortem-ai.cubepath.app](https://postmortem-ai.cubepath.app)

## ✨ Funcionalidades

- 📋 **Análisis automático** — Pega logs o arrastra archivos, obtén un postmortem completo en segundos
- 🎲 **Modo Simulación** — Genera incidentes realistas para entrenar a tu equipo
- 📅 **Timeline interactiva** — Línea de tiempo cronológica del incidente
- 🔍 **Análisis de causa raíz** — Root Cause Analysis con IA
- ✅ **Action Items** — Tareas post-incidente con prioridad y responsable sugerido
- 📄 **Exportación** — Descarga en PDF o Markdown con un clic
- 🌙 **Dark Mode** — Interfaz oscura temática DevOps
- 📱 **Responsive** — Funciona en móvil y escritorio

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | Flask 3, Python 3.11, Anthropic SDK |
| Frontend | React 18, Vite, TailwindCSS, Framer Motion |
| IA | Claude claude-sonnet-4-6 (Anthropic) |
| Almacenamiento | SQLite |
| Infraestructura | CubePath VPS, Nginx, Ubuntu 24.04 |

## 🚀 Desarrollo Local

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Agregar tu ANTHROPIC_API_KEY
flask run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Abrir http://localhost:5173

## 📦 Deploy en CubePath

```bash
# En tu VPS de CubePath:
bash deploy/setup.sh
# Luego editar /opt/postmortem-ai/backend/.env con tu API key
# Obtener SSL: certbot --nginx -d tu-dominio.cubepath.app
```

## 📡 Endpoints de la API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/analyze` | Analiza logs → genera postmortem |
| POST | `/api/simulate` | Genera incidente simulado |
| GET | `/api/postmortems` | Lista el historial |
| GET | `/api/postmortems/:id` | Obtiene un postmortem |
| DELETE | `/api/postmortems/:id` | Elimina un postmortem |
| POST | `/api/export/markdown` | Exporta a Markdown |
| POST | `/api/export/pdf` | Exporta a PDF |
| GET | `/api/health` | Health check |

## 🏆 Hackathon

Creado para la **Hackathon CubePath 2026** (midudev x CubePath).

Desplegado en un VPS Nano de CubePath (1 vCPU, 1GB RAM, Miami) usando el crédito gratuito de $15.
