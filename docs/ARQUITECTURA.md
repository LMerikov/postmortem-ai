# Arquitectura

Postmortem.ai convierte logs, stacktraces o una descripción libre en un postmortem estructurado. Este documento explica el flujo, qué datos salen del servidor y dónde están los límites de confianza.

## Flujo de un análisis

```
Navegador ──POST /api/analyze──▶ Flask
  (X-Client-Id)                   │
                                  ├─ Fase 1 · Filtro local
                                  │    Quita ruido (INFO/DEBUG), hashes, UUIDs y direcciones.
                                  │    Si no hay señal de incidente, responde sin llamar a la IA.
                                  │
                                  ├─ Fase 2 · Caché por similitud (aislada por navegador)
                                  │    Hash exacto o similitud Jaccard ≥ 0,70 sobre palabras clave,
                                  │    solo entre los análisis previos del mismo X-Client-Id.
                                  │
                                  └─ Fase 3 · Modelo de lenguaje
                                       Groq (GPT-OSS 120B) como primario,
                                       Anthropic Claude como respaldo si Groq falla.
                                  │
                                  ▼
                       Postmortem JSON ─▶ base de datos ─▶ { id, postmortem }
```

El resultado tiene un esquema fijo: título, severidad (P0–P4), resumen, timeline tipado, causa raíz, impacto, acciones tomadas, tareas de seguimiento, lecciones y recomendaciones de monitoreo. La interfaz y los exportadores (PDF y Markdown) consumen ese mismo JSON.

## Componentes

| Capa | Dónde | Responsabilidad |
|------|-------|-----------------|
| Interfaz | `frontend/` (React 18, Vite, Tailwind, i18next) | Entrada de logs, resultado, historial, dashboard. Español e inglés. |
| API | `backend/app.py`, `backend/routes/` | Análisis, historial, exportación, estadísticas. Límite de peticiones por IP. |
| Pipeline | `backend/services/` | Filtro local, caché, proveedores LLM, generación de PDF y Markdown. |
| Persistencia | `backend/models/postmortem.py` | PostgreSQL en producción, SQLite en local. Migraciones aditivas al arrancar. |

## Propiedad anónima y privacidad

No hay cuentas de usuario. Cada navegador genera un identificador aleatorio (`crypto.randomUUID`), lo guarda en `localStorage` y lo envía en la cabecera `X-Client-Id` (`frontend/src/services/api.js`).

El servidor nunca guarda ese identificador: guarda su SHA-256 en la columna `owner_hash` (`backend/services/owner.py`). Con él:

- `GET /api/postmortems` devuelve solo los postmortems de ese navegador. Sin identificador, la lista está vacía.
- `DELETE /api/postmortems/:id` solo borra si el postmortem pertenece a ese navegador; en otro caso responde 404.
- La caché de la fase 2 solo reutiliza resultados del mismo navegador. Una persona nunca recibe un postmortem generado a partir de los logs de otra.
- `GET /api/postmortems/:id` sigue funcionando para cualquiera que tenga el enlace. Los IDs son UUID v4 y la respuesta no incluye `owner_hash`.

Los postmortems creados antes de esta versión no tienen propietario: siguen accesibles por enlace, pero no aparecen en ningún historial ni se pueden borrar desde la interfaz.

Esto no es autenticación. Quien copie el `localStorage` de un navegador obtiene su historial. Es el equilibrio elegido para una herramienta sin registro.

## Datos que salen del servidor

- El contenido filtrado de la fase 1 se envía a Groq o a Anthropic para generar el postmortem. Ninguno de los dos usa los datos de su API para entrenar por defecto, pero el texto sí sale de nuestra infraestructura. Por eso la interfaz pide quitar contraseñas y tokens antes de pegar.
- La base de datos guarda el postmortem generado y, en la caché, hasta 2.000 caracteres del contenido normalizado (sin timestamps, IPs, UUIDs ni números largos).

## Límites de confianza

| Entrada | Tratamiento |
|---------|-------------|
| Texto pegado por la persona | Se trata como datos. Se filtra antes de llegar al modelo y nunca se ejecuta. |
| Respuesta del modelo | Se parsea como JSON. Si no es válida, el análisis falla con un error en lugar de mostrar contenido inventado. |
| `X-Client-Id` | Se valida con `^[A-Za-z0-9-]{16,128}$`. Un valor inválido se trata como anónimo. |
| Navegador | CSP estricta (`script-src 'self'`, `font-src 'self'`), `X-Frame-Options: DENY`, sin cookies. Las fuentes se sirven desde el propio dominio. |

## Verificación

- `cd frontend && npm run check` ejecuta ESLint y el build de producción.
- `cd backend && python -m pytest tests` prueba el aislamiento entre navegadores, el borrado, el enlace compartido y la migración de bases existentes.
- GitHub Actions (`.github/workflows/ci.yml`) ejecuta ambos en cada push y pull request.
