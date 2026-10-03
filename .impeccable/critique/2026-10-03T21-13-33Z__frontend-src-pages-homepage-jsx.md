---
target: Postmortem.ai Home + Result
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:/Users/usuario/Proyectos/postmortem-ai/frontend/src/pages/HomePage.jsx"
target_fingerprint: "sha256:3da4dd75268981421de11b134a97ef388d48c6f37a53e70ab8d1c985a7d108f3"
target_path: /Users/usuario/Proyectos/postmortem-ai/frontend/src/pages/HomePage.jsx
timestamp: 2026-10-03T21-13-33Z
slug: frontend-src-pages-homepage-jsx
---
Method: dual-agent (A: design review, live browser · B: detector + browser). Two of B's doubtful findings were verified by the parent.

# Critique 2: Postmortem.ai (Home + Result), Operate mode

Design Health Score: 27/40 (Acceptable, one point from Good). Heuristics: 1=3, 2=3, 3=2, 4=3, 5=2, 6=3, 7=2, 8=3, 9=3, 10=3. Previous run: 24/40.

Design specificity: authored for this product (data-computed polar trace, INC code per incident, P4..P0 blocks, square corners). Below the Result header the page is still a competent dark document.

Detector: CLI 0 findings. Browser overlay: Home 2, Result 13. Real: ~8 text blocks of 83-91 characters per line (68ch is ~85-90 chars, not 68: earlier claim was wrong), breadcrumb title in all caps (42 chars), 11px trace labels and markers, textarea without visible focus (measured by B, confirmed by parent). False positives verified: 3 text-occlusion hits on the closed severity guide (hidden rows keep stale boxes; when open there is no overlap), cramped-padding on the strip swatches, sr-only contrast. Doubtful: width transition attributed to body (source is .btn-primary::after). No horizontal overflow at 390 or 1440.

Priority issues
- [P1] The log textarea has no visible focus indicator (outline none, wrapper border unchanged on focus; computed styles identical before and after). It is the primary control and breaks DESIGN.md's own rule. Fix: the whole frame changes on focus (full white border + 2px outline). Command: harden.
- [P2] Mobile Result header is a wall and the trigger line overflows: line-clamp-2 is on an inline span so it does nothing (6 lines at 390px); no section nav below lg. Fix: real clamp, trace smaller or below the summary on mobile, single Export disclosure, section jump row. Command: adapt (+harden).
- [P2] Root cause buries the answer: Disparador is often a symptom and is repeated in the header; the Conclusion is the last row with equal weight; Evidence is one semicolon-joined run ending in ".;". Fix: lead with Conclusion at 17px, demote Disparador/Cascada, one log line per evidence row. Command: clarify, then layout.
- [P2] The draft never becomes "reviewed" and the flow ends on a button row; action-item checkboxes are lost on reload and look tracked on shared links. Fix: persist per incident in the browser with a "this browser only" note or plain list + Copy tasks; a "mark as reviewed" state shown in History. Command: harden, delight.
- [P3] Measure ~85-90 chars/line (cap at ~55ch), trace labels ~8px on mobile, all-caps 42-char breadcrumb, simultaneous marks 4/5 overlap, width transition on the button block. Command: typeset.

Persona red flags
- On-call 3am: Generate below the fold on short laptops while the reacting trace is out of view; the cause is in the last Root Cause row; no copy per section.
- First-timer: trace needs a 3-line caption; Disparador/Cascada/Conclusión undefined; no prompt to challenge an assigned severity.
- Screen reader: Home trace named only "Ejemplo"; numeric marks not exposed as a list; TOC active state visual only. Positive: AnalysisStatus uses role=status.

Minor: Cargar ejemplo stays after content exists; nav marks Historial on a link-opened result; TOC scroll-spy lag; collapsed sections show only counts and headings read the count; three identical History titles; no "your text is kept" line on cancel.

Questions: what single sentence should a reader of the first screen leave with, symptom or cause; would on-call miss the trace at half size with the summary above; what if "reviewed" were a real state shown in History.
