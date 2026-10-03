# Auditoría heurística — Postmortem.ai

Método: Krug (Don't Make Me Think, Trunk Test) + 10 heurísticas de Nielsen. Severidad 0–4.

**Puntaje actual: 6/10** → objetivo 10/10.

| # | Hallazgo | Heurística | Sev. | Arreglo |
|---|----------|-----------|------|---------|
| 1 | Estadísticas inventadas: "97% precisión", "4h+ ahorro", y `aggregateRating 4.9 / 1000 votos` en JSON-LD. Daña credibilidad y es contenido engañoso para buscadores. | Honestidad / Match con el mundo real | 3 | Quitar rating falso; sustituir por datos medibles (nº real de postmortems, tiempo real de generación) |
| 2 | Enviar logs vacíos muestra un toast "Error" sin explicación. | H9 Errores | 3 | Mensaje: "Pega logs o describe el incidente para continuar", foco en el input |
| 3 | Las simulaciones rápidas aparecen dos veces en la home (sección y "Modo Entrenamiento"). | H8 Minimalismo | 2 | Dejar una sola sección |
| 4 | Home demasiado larga: stats, 6 features, 4 personas, entrenamiento y CTA repetido. | Krug: quitar la mitad de las palabras | 2 | Reducir a hero + input + 3 beneficios + cómo funciona |
| 5 | Emojis como iconos (secciones, simulaciones, personas) dan aspecto amateur e inconsistente entre plataformas. | H4 Consistencia / H8 | 2 | Usar Lucide en todo |
| 6 | Mezcla de español/inglés ("Team Leads", "High", "Warning", "Info"). | H2 / H4 | 2 | Un idioma por interfaz (ya hay i18next, usarlo) |
| 7 | `getStats()` sin catch: si el backend falla, error no manejado. | H1 Estado del sistema | 2 | Manejo silencioso con fallback |
| 8 | Loading de análisis sin progreso real ("~5 segundos" prometido). | H1 | 2 | Pasos visibles (leyendo logs → causa raíz → timeline) y sin promesa de tiempo |
| 9 | Resultado sin tabla de contenido ni navegación entre secciones largas. | Trunk Test / H6 | 2 | Índice lateral sticky con sección activa |
| 10 | Sin atajos de teclado (Ctrl/Cmd+Enter para generar). | H7 Eficiencia | 1 | Añadir atajo y mostrarlo en el botón |
| 11 | Privacidad ("no usamos tus logs") sin enlace a detalle ni aviso sobre datos sensibles. | H10 / Confianza | 2 | Aviso para redactar secretos + enlace a política |
| 12 | Tarjetas con `scale` en hover y animaciones de entrada en todo; ruido visual. | H8 | 1 | Animar menos, respetar `prefers-reduced-motion` |
| 13 | Botón "Volver" en resultado sin breadcrumb/contexto de dónde estoy. | Trunk Test | 1 | Breadcrumb Historial › Postmortem |
| 14 | Sin foco visible ni `aria-label` en varios controles. | WCAG | 2 | Revisar focus rings, labels y contraste |

## Estado tras el pulido (2026-10-03)
Resueltos: 1–14. Se quitó de la home la sección de simulaciones rápidas y "Modo Entrenamiento" (después se eliminó el modo Simulación por completo), las estadísticas no verificables y el rating falso del JSON-LD. Además se añadió i18n ES/EN con selector, `Ctrl/⌘+Enter`, carga por pasos, índice lateral con sección activa, breadcrumb, deshacer al eliminar del historial, iconos Lucide en todo, tipografía Geist, foco visible, selección temática y `prefers-reduced-motion`.

**Puntaje estimado: 9/10.** Falta validar con usuarios reales y revisar el PDF exportado (lo genera el backend).

## Para llegar a 10/10
Arreglar 1–3 (credibilidad, error de input, duplicados) y 4–9 (contenido, iconos, idioma, estados, navegación). El resto es pulido.

## Qué falta agregar (funcionalidad)
- Plantillas de postmortem (Google SRE, Blameless, formato corto)
- Editar el postmortem antes de exportar
- Compartir con enlace de solo lectura
- Integraciones: webhook / Slack / Jira para action items
- Exportar a PDF con identidad propia
- Métricas reales de MTTR / MTTD en el dashboard

---

## Ronda 2 (2026-10-03, después del merge de #1)

Puntaje antes: **8/10** → después: **10/10** estimado (sin hallazgos de severidad 3+ y ninguna fila del diagnóstico rápido fallando).

| # | Hallazgo | Sev. | Arreglo |
|---|----------|------|---------|
| 1 | Una ruta inexistente dejaba la página en blanco | 3 | Página 404 con salida al inicio |
| 2 | El dashboard sumaba todos los usuarios; el historial es privado | 2 | `/api/dashboard` limitado al navegador + test |
| 3 | "(1 incidentes)" y tipos de error en inglés | 2 | Plurales de i18next y tipos traducidos |
| 4 | Placeholder con contraste 4,14:1 | 2 | `text-muted/90` → 6,08:1 |
| 5 | Botón principal deshabilitado sin explicación | 2 | Siempre activo; si el campo está vacío enfoca el campo y explica |
| 6 | Sin enlace "Saltar al contenido" | 1 | Skip link que lleva el foco a `<main>` |

Fuera de alcance: la severidad que asigna el modelo (un 503 de checkout salió como P3) es calidad del análisis, no de interfaz.
