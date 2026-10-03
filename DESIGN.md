---
name: Postmortem.ai
description: A numbered incident catalog in matte black; one polar trace per incident, state coded in flat colour blocks.
colors:
  ground: "#050505"
  panel: "#0D0D0D"
  field: "#080808"
  code-well: "#030303"
  raised: "#171717"
  hairline: "#2E2E2E"
  plot-line: "#BDBDB8"
  plot-white: "#F2F2EC"
  muted-ink: "#A3A39E"
  block-red: "#D9261C"
  block-yellow: "#F0C20A"
  block-blue: "#2B57D6"
  block-white: "#F2F2EC"
  block-grey: "#8C8C88"
typography:
  display-inc:
    fontFamily: "Archivo Variable, Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3.5rem)"
    fontWeight: 500
    lineHeight: 0.92
    letterSpacing: "-0.02em"
    fontVariation: "wdth 125"
  display-severity:
    fontFamily: "Geist Mono Variable, ui-monospace, monospace"
    fontSize: "clamp(2.25rem, 4.2vw, 3.5rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Archivo Variable, Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 5.4vw, 4.4rem)"
    fontWeight: 500
    lineHeight: 1.02
    letterSpacing: "-0.025em"
    fontVariation: "wdth 108"
  title:
    fontFamily: "Archivo Variable, Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2.1rem)"
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: "-0.01em"
    fontVariation: "wdth 108"
  body-reading:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.65
  body:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.625
  label-caps:
    fontFamily: "Archivo Variable, Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "0.2em"
    fontVariation: "wdth 112"
  label-caps-lg:
    fontFamily: "Archivo Variable, Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    letterSpacing: "0.18em"
    fontVariation: "wdth 112"
  mono:
    fontFamily: "Geist Mono Variable, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  none: "0px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "48px"
  gutter: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.plot-white}"
    typography: "{typography.label-caps-lg}"
    rounded: "{rounded.none}"
    padding: "12px 56px 12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.plot-white}"
    textColor: "{colors.ground}"
  button-secondary:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.plot-white}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.raised}"
  button-ghost:
    textColor: "{colors.muted-ink}"
    typography: "{typography.label-caps}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.none}"
    padding: "24px"
  input-log:
    backgroundColor: "{colors.field}"
    textColor: "{colors.plot-white}"
    typography: "{typography.mono}"
    rounded: "{rounded.none}"
    padding: "16px 20px"
    height: "224px"
  nav-link-active:
    backgroundColor: "{colors.plot-white}"
    textColor: "{colors.ground}"
    typography: "{typography.label-caps-lg}"
    padding: "0 24px"
  severity-block-xl:
    backgroundColor: "{colors.block-red}"
    textColor: "#FFFFFF"
    typography: "{typography.display-severity}"
    rounded: "{rounded.none}"
    padding: "12px 20px"
  analysis-status:
    backgroundColor: "{colors.field}"
    textColor: "{colors.plot-white}"
    typography: "{typography.label-caps-lg}"
    rounded: "{rounded.none}"
    padding: "16px"
  details-section:
    textColor: "{colors.plot-white}"
    typography: "{typography.label-caps-lg}"
    padding: "20px 0"
  history-row:
    textColor: "{colors.plot-white}"
    rounded: "{rounded.none}"
    padding: "20px 4px"
  severity-code-p0:
    backgroundColor: "{colors.block-red}"
    textColor: "#FFFFFF"
  severity-code-p1:
    backgroundColor: "{colors.block-yellow}"
    textColor: "#000000"
  severity-code-p2:
    backgroundColor: "{colors.block-blue}"
    textColor: "#FFFFFF"
  severity-code-p3:
    backgroundColor: "{colors.block-white}"
    textColor: "#000000"
  severity-code-p4:
    backgroundColor: "{colors.block-grey}"
    textColor: "#000000"
---

# Design System: Postmortem.ai

## Overview

**Creative North Star: "The Numbered Catalog"**

Each incident is a catalog entry, like a Factory Records sleeve: a huge wide INC code, a title, one block of colour that says how bad it was, and a single polar trace that owns the field. The ground is matte black, the ink is fine off-white plot lines, every corner is square. Colour is not decoration here; it is the severity code and the "active" marker, and nothing else.

The system is dense but quiet. Information lives in ruled rows (label left, value right, hairline between), never in floating cards with shadows. Reading is the job after the first glance, so prose is set in Geist at 15 to 17px on generous leading, while the engraved spaced caps carry the labelling voice. The page refuses the dark violet panel with soft cards.

The polar trace is a measurement. It is always computed from real data (pasted log lines on Home, timeline events on the Result and History pages, via `frontend/src/lib/incident.js`). It is never ornament. The one exception is the empty Home dial, which shows a ghosted trace of the built-in example log, labelled EXAMPLE; once the user types, the example gives way to their own data.

**Key Characteristics:**
- Matte black ground, fine white plot ink, hairline borders; no gradients, no shadows.
- Radius 0 everywhere; the only round shape is the loading spinner.
- Colour reserved for meaning: severity blocks P4..P0 and red as the "active / first failure" marker.
- Two voices: wide Archivo (INC code, headlines, engraved caps) and Geist (prose); Geist Mono only for times and codes.
- Severity is never colour alone: always the P-code and its word beside the block.

## Colors

A black-and-white catalog with five flat signal blocks held in reserve. Source of truth: `frontend/tailwind.config.js`.

### Primary
- **Active Red** (#D9261C, `block-red`): P0 severity, the block on the primary button, the first-failure marker on the trace and timeline, the active nav tick, the small square beside the root-cause Disparador, the active TOC square, the 12px header band (P0), the caret and text selection, error banners. Red means "this is the live or worst thing".

### Secondary (severity blocks)
- **Signal Yellow** (#F0C20A, `block-yellow`): P1; medium priority; also the 12px header band when the incident is P1.
- **Catalog Blue** (#2B57D6, `block-blue`): P2.
- **Sleeve White** (#F2F2EC, `block-white`): P3; also the plot ink.
- **Slate Grey** (#8C8C88, `block-grey`): P4; low priority, info toasts.

Text on red and blue blocks is white; on yellow, white and grey blocks it is black.

### Neutral
- **Matte Black** (#050505, `ground`): page ground.
- **Panel Black** (#0D0D0D, `panel`): the rare `.card` surface.
- **Field Black** (#080808, `field`): inputs and the log slot.
- **Code Well** (#030303, `code-well`): `pre` blocks.
- **Raised Black** (#171717, `raised`): hover fill for rows, secondary buttons, TOC.
- **Hairline** (#2E2E2E, `hairline`): every default border and the plot grid.
- **Plot Line** (#BDBDB8, `plot-line`): framing borders (used at 40 to 70% alpha), primary button frame, input focus border.
- **Plot White** (#F2F2EC, `plot-white`): body text, the trace stroke, focus outline, inverted active states.
- **Muted Ink** (#A3A39E, `muted-ink`): secondary text and captions.

### Named Rules
**The Meaning-Only Colour Rule.** A saturated colour appears only as severity, priority, or the active/first-failure marker. If a block is not saying how bad or what is live, it is black, white, or grey.

**The Never-Colour-Alone Rule.** Every colour block travels with its P-code (or priority word). The block is the code; the words are the meaning.

**The One Red Rule.** Red marks one live thing per region: the primary button's block, the first failure on the trace, the active TOC square, the P0 severity block. Where severity is P0, the primary export button's block turns plot-white so severity is the only red. Do not scatter it.

## Typography

**Display Font:** Archivo Variable (wdth axis; fallback Geist Variable, system-ui)
**Body Font:** Geist Variable (fallback ui-sans-serif, system-ui)
**Label/Mono Font:** Archivo Variable for engraved caps; Geist Mono Variable for times and codes only

**Character:** Wide, engraved Archivo gives the sleeve its monumentality and its small-print authority; Geist keeps long reading calm. Fonts are self-hosted via @fontsource-variable (server CSP is `font-src 'self'`); never reference a remote font host.

### Hierarchy
- **Display INC** (Archivo 500, clamp(2rem, 4vw, 3.5rem), 0.92, -0.02em, width 125%): the incident code "INC 3EA5" on Result, kept smaller so the severity block leads; 404/empty-state codes use larger clamps. Class `.display-wide`.
- **Display Severity** (Geist Mono 600 with slashed zero, clamp(2.25rem, 4.2vw, 3.5rem), 1; mono because in wide Archivo "P0" reads as "PO"): the P-code inside the `xl` severity block, the loudest figure in the header.
- **Headline** (Archivo 500, clamp(2.4rem, 5.4vw, 4.4rem), 1.02, -0.025em, width 108%): Home h1, max 17ch.
- **Title** (Archivo 500, clamp(1.5rem, 3vw, 2.1rem), 1.12, width 108%): the incident title, max 26ch.
- **Body reading** (Geist 400, 17px, 1.65): summary and the root-cause Conclusión, capped at 56ch (about 70 characters per line).
- **Body** (Geist 400, 15px, ~1.6): list items, timeline events, descriptions. Subtitles on Home run at 18px, capped at 50ch. Root-cause evidence lines are Geist Mono 13px. Figure captions and the "how to read the trace" lines are 13px muted.
- **Label** (Archivo 500, 12px, 0.2em, uppercase, width 112%, `.caps`; 13px at 0.18em, `.caps-lg`): section headings, buttons, captions, nav. The engraved caps voice.
- **Mono** (Geist Mono, 12 to 13px): timestamps, T+ elapsed labels, severity codes, event numbers, counts, the log textarea.

### Named Rules
**The Engraved-Caps Rule.** Labels are small, wide-tracked Archivo caps (`.caps` / `.caps-lg`). Prose is never set in caps and never in Archivo.

**The Mono-Means-Data Rule.** Geist Mono is for times, codes, counts and pasted or quoted log lines only; never for sentences or headings.

**The Measure-In-Characters Rule.** Reading width is stated as characters per line, about 70, and set as a 56ch cap. `ch` is the width of the digit "0", roughly 25% wider than an average letter, so 56ch yields about 58 to 73 characters; the earlier 68ch gave 83 to 91. Do not set a cap in `ch` by reading it as a character count.

## Layout

A single `max-w-7xl` column with 16/24/32px side padding by breakpoint. Home is one grid with two reading orders: on phones headline, then form, then trace; from `lg` the headline sits left and the trace (380px) right, with the log form spanning both columns beneath. Result opens with a two-column header: identity, severity and export at left (flexible), the trace at right (up to 440px), stacking below `lg`; on phones the trace leaves the header and follows the Executive Summary (max 240px, 300px from `sm`), so the summary starts near 890px down at 390px wide instead of 1280px; P0 and P1 add a 12px solid severity band on the header's left edge. Decision sections (summary, timeline, root cause, impact, action items) stay open; reference sections (actions taken, lessons, monitoring) are collapsible. The last section is followed by the review close (see Components) and then a second export bar, always fully open. Result adds a 190px sticky table of contents at `lg+`, and below `lg`, where it disappears, a labelled native "Ir a" select (with a placeholder) that jumps between sections and opens collapsed ones. The table of contents' active entry is a white-filled row with black text and a small red square (no side stripe).

Rhythm is ruled rather than boxed: sections are separated by a top hairline and a 20px pad; lists and definition rows use a bottom hairline and 12 to 20px vertical padding (`.rule-row`). Section spacing is 48px (`space-y-12`); in-section spacing 16 to 24px. Timeline rows are grid: number block, mono time column (9.5rem), then text. History rows are grid: code with its severity strip, thumbnail trace (72px, hidden on phones), title and summary, severity, delete. Reading measure is about 70 characters per line, set as a 56ch cap on summary, root cause, timeline events, action items and the header lines; short copy 48 to 50ch.

## Elevation & Depth

Flat. There are no box shadows; depth is a stepped scale of near-blacks and hairlines. Hover is a fill change (raised black, or full inversion to white-on-black), never lift. The single inset ring is the file drag state (`inset 0 0 0 2px` plot white). The drag veil is the only translucent layer.

### Named Rules
**The Flat-Black Rule.** Surfaces separate by hairline and tone, not by shadow, glow or blur.

## Shapes

Right angles only. Every Tailwind radius step is remapped to 0 in the config; `rounded-full` survives solely for the spinner. Frames are 1px hairlines (`hairline` at rest, `plot-line` at 40 to 70% for emphasis). Signature silhouettes: the full-height colour block fused to the edge of a control (primary button's red block on the right, toast's 6px left bar, priority chip's 8px left block, nav's 4px active tick); the 40px square event number on the timeline; the square checkbox; the 5-block severity strip (36px by 10px blocks, 4px apart, non-active blocks drop to 25% opacity when one is `active`).

## Components

### Buttons
- **Shape:** square, 1px frame.
- **Primary:** black ground, plot-line frame, `.caps-lg` text, 12px 56px 12px 20px padding. A red block (36px wide, full height) is fused to the right edge as the active marker (48px box scaled on X from 0.75, i.e. 36px, to 1, i.e. 48px on hover, origin right, via `transform`, not `width`); the button inverts to white with black text. Disabled: border and text go muted, block turns hairline grey.
- **Secondary:** hairline frame, `.caps`, 10px 16px; hover raises fill and brightens the frame.
- **Ghost:** muted `.caps` text, no frame, brightens on hover.
- **Icon button:** 40px square, muted, fills raised on hover; destructive hover fills red with white icon.
- **Phone export:** below `lg` the Result header shows one primary "Exportar" control (`aria-expanded`) that expands in place into PDF, Markdown and Copy; the closing export bar is always open.

### Severity badge and strip
A framed pair: a coloured block holding the mono P-code (white text on red/blue, black on others), then the severity word in engraved caps. Sizes `md` and `lg` are for rows and lists. Size `xl` is the Result header block: the P-code in Display Severity on the severity fill (20px by 12px padding), beside the word in `.caps-lg`. The strip (ColorStrip) shows all five blocks P4 to P0; with `active` the others fade. It appears in the nav at 20px by 4px, on Home at full size once under the form as the legend, and under the INC code on Result and in each History row (16px by 6px blocks) tied to the entry.

### Severity guide
A collapsed `<details>` under the xl badge: caps summary with a square +/- marker (12px), then P0 to P4 rows (P-code block, word, definition), the current level on a raised fill, and a note stating these are common SRE conventions rather than a standard.

### Signal plot (signature)
A 400-unit square SVG: concentric hairline rings, 24 spokes, a closed ridge in plot white (1.25px stroke, 7% fill) with radius driven by values 0 to 1 from 12 o'clock clockwise, a hollow hub. Numbered marks are a spoke, a 6px square, and a mono label; the first failure mark is red, the rest white. A red sweep line rotates (7s) only while the server works. The ridge has 120 bins. Each event also leaves "shoulders" on its neighbours (height w / (1 + 0.7d) x 0.85 for d up to 6 on Result; the log trace uses d up to 2): this smooths the same data into a readable ridge and adds no variation of its own. Compact mode (history thumbnails) draws one outer ring, a heavy 7 stroke and a 25% fill only. The `ghost` prop draws the whole plot at 38% opacity and is used only for the labelled EXAMPLE trace on an empty Home dial. Home values come from log level per line (FATAL 1, ERROR 0.82, WARN 0.5, INFO 0.2, DEBUG 0.1); Result and History values come from timeline event type and position in elapsed time. Mark labels take a `labelSize` in viewBox units (default 15; 19 on the phone figure so labels render near 11px), and crowded marks step outward 22 units rather than 15. Each trace carries a one-line "how to read the trace" caption. The trace is always computed, never decorative.

### Timeline
Ruled ordered list. Each row: a 28px square number (outlined; solid red with a FIRST FAILURE tag for the first alert/error/critical event), mono time plus `T+hh:mm:ss` elapsed, the event type as caps, and the event in 15px Geist. A redundant level prefix ("ERROR:") is stripped from displayed text, and an unknown value reads "Sin datos".

### Collapsible section
Native `<details>`/`<summary>` under a top hairline: the summary is the `.caps-lg` heading, a mono two-digit count, and at the right a 24px square +/- marker; hover fills raised. The count is `aria-hidden` and the marker is 12px type. A TOC click, the "Ir a" select or a `#hash` opens a collapsed section. Closed by default for reference sections only.

### Log input
One framed slot: caps label bar ("Logs del incidente" / "Incident logs") with Open file / Clear, mono 13px textarea (224px, resizable), privacy and count hints, and the Example and Generate buttons at the foot. Example disappears once there is content (Clear already exists). Errors appear as a full-width red band with white text. While the model works the form is replaced by the submitted log, read-only, first five lines, with a line and character count. Drag state is the inset ring plus a dark veil. Focus is carried by the outer frame via `focus-within`: the border goes full plot-white and a 2px solid plot-white outline sits at 3px offset; the textarea itself draws no ring.

### Analysis status
A framed field-black box with `role="status"`: a spinner and `.caps-lg` message at left, real elapsed time as mono mm:ss at right, a muted hint line, and a secondary Cancel button. On a 429 the message becomes the real countdown to an automatic retry (at most 2); the elapsed counter does not reset across retries. It sits under the trace in place of its caption. It never shows stages it does not know.

### Navigation
Sticky 64px bar on solid ground with bottom hairline. Logo is a square-framed pulse mark plus wide uppercase wordmark ("Postmortem" white, ".ai" muted) with a mini colour strip. Links are bordered cells in `.caps-lg`; active inverts to white-on-black with a 4px red left tick. ES/EN switch is a framed pair; active inverts. Below `md` it collapses to a menu panel of full-width rows. A skip link appears on focus.

### Rows, lists and impact
Definition rows (`.rule-row`) for impact and dashboard stats, bullets as 6px squares, lessons numbered in mono, action items with a square checkbox and a priority chip (left block red/yellow/grey plus the word). Dashboard bars are 14px segmented blocks. The Result header adds a "Causa raíz" line quoting the conclusion (the Disparador when there is none), clamped to 3 lines with an underlined "Ver causa raíz" link to the section. Below the header, a note reads "AI-generated draft, verify each point" until the incident is marked reviewed (see Review state). The Root cause section leads with the Conclusión as a 17px reading paragraph under a caps label; Disparador (caps label with a small red square) and Cascada follow as supporting rows in a definition list on a 9rem label column. Evidencia is split into separate Geist Mono 13px log lines when the model's text is a list or bracketed lines joined by ";", otherwise it is a normal paragraph. Breadcrumb incident titles are sentence case, not caps. Keycap hints (`.kbd`) are 12px.

### Review state
A deliberate human mark, local to the browser. Ticked follow-up tasks (the action items' square checkboxes) and a "Marcar como revisado" mark are stored per incident in `localStorage` under `pm-review:<id>` as ids and flags only, never incident content, with an in-memory fallback when storage is blocked. The top note turns from the draft line to "Revisado por ti el <fecha>. Solo se guarda en este navegador." The closing block, before the final export bar, is a secondary button with `aria-pressed` and a 16px square checkbox glyph (filled plot-white with a check when reviewed) plus a hint line (13px muted, 48ch). History rows show the word "Por revisar" or "Revisado" in caps with an empty or filled 10px square; the History header counts "N por revisar". Deleting a postmortem clears its mark. Limits: per browser, not shared, not in exports, and it verifies nothing; it records only that a person said they checked.

### Toasts, loading, empty states
Toast: hairline frame on black with a 6px left block (white success, red error, grey info). Loading is the Analysis status box (above); the spinner is the only round shape. Empty and 404 states reuse the INC code as a large display ("INC 0000", "INC 404") with a primary button.

### Named Rules
**The Data-Only Trace Rule.** The polar trace draws measured data only. Smoothing shoulders spread the same data; the single exception is the ghosted example, which must be labelled EXAMPLE.

**The Honest-Status Rule.** Status UI shows elapsed time and real countdowns, a way out (Cancel), and no invented stages.

**The Local-Is-Labelled Rule.** State kept only in this browser (ticked tasks, the reviewed mark, the history list) always says so where it is shown, in the interface's own words: "Solo se guarda en este navegador."


## Do's and Don'ts

### Do:
- **Do** keep every radius at 0; `rounded-full` is for the spinner only.
- **Do** pair each severity colour block with its P-code and label (see `SeverityBadge`); order the scale P4 to P0, grey, white, blue, yellow, red.
- **Do** compute every trace from real data via `lib/incident.js`; ghost it only when it is labelled as an example.
- **Do** make status UI report only what is known (elapsed time, a real countdown); never invent stages.
- **Do** use engraved caps (Archivo, 12 to 13px, 0.18 to 0.2em, width 112%) for labels, Geist 15 to 17px at 1.6+ leading for prose, capped at 56ch (about 70 characters per line), and Geist Mono only for times and codes.
- **Do** use the INC display (Archivo, width 125%) for incident codes.
- **Do** separate content with hairlines and tonal black steps; make hover a fill change.
- **Do** keep a visible focus indicator (2px plot-white outline, 3px offset) on every interactive element; for the log input the indicator sits on the outer frame (`focus-within`: plot-white border plus the outline), not on the textarea; keep the skip link, and honour `prefers-reduced-motion` (animations and transitions collapse to near-zero).
- **Do** meet WCAG 2.1 AA contrast; muted ink on ground and white on red/blue blocks were chosen for it.
- **Do** label browser-local state as such ("Solo se guarda en este navegador") wherever it is shown, and keep exports free of it.
- **Do** self-host fonts through @fontsource (CSP `font-src 'self'`).

### Don't:
- **Don't** use colour as the only carrier of meaning; a block without its code or word is a defect.
- **Don't** spend red, yellow or blue on branding, links, or decoration.
- **Don't** add box shadows, glows, gradients, or rounded corners; no dark violet panel with soft cards.
- **Don't** draw a decorative or random trace; if the data is absent, show no signal or a labelled example.
- **Don't** invent loading stages or progress the server has not reported.
- **Don't** mark the active TOC row with a coloured side stripe; fill it white.
- **Don't** set prose in caps or Archivo, or sentences in mono.
- **Don't** load fonts from a remote host.
- **Don't** read `ch` as a character count; cap prose at 56ch for about 70 characters per line.
- **Don't** present the reviewed mark as verification; it is a personal note, not a check.

### Not canonized (defects the build carries, not rules)
- The one-off lighter red `#FF6B60` for the first-failure mark's text label inside the plot (red `#D9261C` is below 4.5:1 for 11px text on black), and the raw `#4A4A4A` compact ring stroke, are SVG literals outside the token set; use the tokens on new work.
