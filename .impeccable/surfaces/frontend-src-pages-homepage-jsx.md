---
version: 1
slug: "frontend-src-pages-homepage-jsx"
primary_target: "frontend/src/pages/HomePage.jsx"
related_targets: ["frontend/src/pages/ResultPage.jsx","frontend/src/pages/HistoryPage.jsx","frontend/src/pages/DashboardPage.jsx"]
---

# Surface brief: Postmortem.ai (app completa, modo Operate)

Visitante: SRE/DevOps tras un incidente. Tarea: pegar logs, revisar el postmortem, exportar. Mundo elegido por el usuario: catálogo industrial numerado (Factory Records), pinned sobre "computación retro".

## Direction contract

THESIS: Cada incidente es una entrada de catálogo numerada y una sola traza polar posee el campo; el estado se codifica en bloques de color. Rechaza el panel oscuro violeta con tarjetas.
OWN-WORLD: negro mate, tinta blanca de trazo fino, ángulos rectos (radio 0); bloques gris, blanco, azul, amarillo y rojo = P4 a P0; Archivo ancho para el código INC, mayúsculas grabadas espaciadas, Geist para la prosa, Geist Mono solo en horas y códigos.
STORY: en una mirada la persona entiende qué pasó (código, severidad, traza), lee el documento con comodidad y lo exporta.
FIRST VIEWPORT: Home: titular ancho y ranura de logs a la izquierda; a la derecha la traza polar que se dibuja con las líneas pegadas; fila de estado abajo. Resultado: código INC enorme, título, bloque de severidad y la traza del timeline a la derecha.
FORM: Catálogo numerado, elegido por el usuario (no por la tirada); lugar 5 de 7; seed 131973a3.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
