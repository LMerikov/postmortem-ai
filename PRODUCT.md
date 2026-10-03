# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Equipos SRE y DevOps que acaban de cerrar un incidente y deben documentarlo para su equipo y para quien decide. Llegan con logs, stacktraces y notas sueltas, a menudo después de una guardia, y necesitan un borrador revisable, no una pantalla que los entretenga.

## Product Purpose

Convertir logs, stacktraces o una descripción libre en un postmortem estructurado (severidad, timeline, causa raíz, impacto, tareas de seguimiento, lecciones y recomendaciones de monitoreo) que el equipo revisa y exporta a PDF o Markdown. Éxito: el equipo dedica su tiempo a validar y decidir, no a transcribir.

## Positioning

El resultado es un documento estructurado y exportable con un esquema fijo, no una conversación. Lo que un chat de IA genérico no entrega por sí mismo es ese formato estable, listo para compartir.

## Operating Context

Se usa justo después de un incidente. Entradas típicas: archivos `.log`, `.txt`, `.json` o texto pegado (hasta 5 MB). Salidas: el documento en pantalla, PDF, Markdown o JSON copiado a una herramienta de tickets. Cada análisis se apoya en modelos de lenguaje alojados fuera del servidor, por lo que el texto sale de la infraestructura del producto.

## Capabilities and Constraints

- Análisis de logs con un filtro local previo, caché por similitud y modelos de Groq (`openai/gpt-oss-120b`, con `gpt-oss-20b` de respaldo) y Anthropic opcional.
- Historial y dashboard por navegador: sin cuentas, con un identificador anónimo; los enlaces a un postmortem son compartibles.
- Interfaz completa en español e inglés (español por defecto).
- Restricciones técnicas: el plan gratuito de Groq permite 8.000 tokens por minuto; el servidor aplica una CSP estricta, así que las tipografías y recursos deben servirse desde el propio dominio.
- Sin decidir: modelo de negocio, límites de uso para el público, y si habrá cuentas de usuario.

## Brand Commitments

- Nombre: Postmortem.ai (dominio postmortem-ai.xyz).
- Español e inglés son parte de la identidad del producto, no un añadido.
- El logo actual (línea de pulso) no fue declarado vinculante.

## Evidence on Hand

- `examples/logs/`: cuatro incidentes ficticios con su causa raíz esperada, usados para probar el producto de punta a punta.
- Capturas del producto en `docs/screenshots/` e imagen social en `frontend/public/og.png`.
- No hay clientes, testimonios, métricas de precisión ni benchmarks verificables; ninguno debe inventarse en la interfaz ni en el README.

## Product Principles

1. El postmortem es un borrador que una persona revisa: la interfaz nunca presenta una conclusión del modelo como un hecho verificado.
2. Primero la evidencia: cada afirmación del documento se apoya en líneas del log.
3. Distinguir la causa del síntoma es la parte que más vale; el diseño debe hacerla legible a simple vista.
4. Privacidad por defecto: sin registro, historial por navegador y avisos claros sobre qué sale del servidor.
5. Dos idiomas, un mismo producto: ningún texto, estado ni error puede quedar solo en uno.

## Accessibility & Inclusion

Estándar WCAG 2.1 AA como mínimo: contraste 4,5:1 en texto, foco visible, navegación completa con teclado, enlace de salto al contenido y respeto a `prefers-reduced-motion`. Cualquier estilo visual debe cumplirlo sin excepciones.
