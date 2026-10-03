---
target: Postmortem.ai Home + Result
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/usuario/Proyectos/postmortem-ai/frontend/src/pages/HomePage.jsx"
target_fingerprint: "sha256:31d70440e9f8745a366815bff77307acc30902d4458f4810dcb7087360a5c311"
target_path: /Users/usuario/Proyectos/postmortem-ai/frontend/src/pages/HomePage.jsx
timestamp: 2026-10-03T20-36-08Z
slug: frontend-src-pages-homepage-jsx
---
Method: dual-agent (A: design review · B: detector + browser). A worked from source, PRODUCT.md, DESIGN.md and existing captures (no live browser).

# Critique: Postmortem.ai (Home + Result), Operate mode

Design Health Score: 24/40 (Acceptable). Heuristics: 1=2, 2=3, 3=2, 4=3, 5=2, 6=3, 7=2, 8=3, 9=2, 10=2.

Design specificity: authored for this product (numbered incident catalog, data-computed polar trace). Reservations: Home half-delivers the idea (empty dial, decorative colour strip); below the Result header the page is an ordinary ruled document.

Detector: CLI 0 findings. Browser overlay (9 notes): useful = 3 text lines of ~90ch on Result (own rule is 68ch), all-caps on two 32-33 char sentences, width transition on .btn-primary::after; agrees with A on 11px caps (5 elements on Home mobile, 32 on Result). False positives: cramped-padding on the severity strip li, 8 contrast hits that are sr-only text. No horizontal overflow at 390px, no images without alt, h1>h2 outline correct.

Priority issues
- [P1] Waiting state is a dead end: form disappears, steps are timer theatre, no cancel, no elapsed time, 429 only as a toast. Fix: keep log visible, status list beside the sweeping dial, real elapsed counter, in-place countdown on 429, Cancel. Command: harden (+animate).
- [P1] Result hierarchy answers the wrong question first: ~80px INC code outshouts the small severity chip and the trigger (section 3); red is spent on chrome so P0 is not distinct. Fix: trigger line under title, bigger severity block, smaller INC code, P0/P1 header treatment. Command: layout, then bolder.
- [P2] Result is a long all-open scroll with no review layer, no end state, no "AI draft" stance (Product Principle 1); three text blocks exceed 68ch. Fix: collapse lessons/monitoring/actions taken, export bar at the end, draft line, cap measure at 68ch. Command: distill (+clarify, typeset).
- [P2] Home spends its first viewport on an empty dial; on mobile the textarea starts ~830px down; "Qué incluye" is filler. Fix: form right after headline on mobile, ~160px dial, faint labelled example trace, shrink "Qué incluye". Command: adapt, then shape.
- [P3] Trace and P0-P4 scale unexplained; 11px caps, all-caps sentences, two SVG colour literals. Fix: "how to read" caption, P0-P4 legend, 13-14px secondary text. Command: clarify (+typeset).

Persona red flags
- On-call 3am power user: ~4000px scroll to the tasks, no export/section shortcuts, PDF is the primary action but copying tasks to a ticket is the likely next step, 11px muted caps tire the eyes.
- First-timer: dial reads as an unexplained radar, INC code looks like a bug id, "Primer fallo" vs "Disparador" confusing, no sample result before pasting logs.
- Screen-reader user: INC code is aria-hidden so the heading is only the title; trace marks probably not announced as data; verify reading order.

Minor: nav highlights "Historial" right after analysing; counter "N postmortems generados" is weak proof; English log prefixes inside Spanish events; transition-[width] animates a layout property.

Questions: what if Home drew a faint example trace until the user types; what does P0 look like when red is already spent on chrome; what if Result were a review checklist with export as the last step.
