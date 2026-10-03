// Pure helpers that turn real incident data into what the catalog UI shows.

/** Stable catalog code from a postmortem id: "3ea533b4-…" → "3EA5". */
export function incidentCode(id) {
  const hex = String(id ?? '').replace(/[^0-9a-f]/gi, '')
  return hex.slice(0, 4).toUpperCase() || '0000'
}

const TIME = /(\d{1,2}):(\d{2})(?::(\d{2}))?/

/** Seconds since midnight from "14:32:10" or an ISO timestamp; null when absent. */
export function clockSeconds(value) {
  const m = TIME.exec(String(value ?? ''))
  if (!m) return null
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3] ?? 0)
}

/** "T+00:03:10" relative to the first timestamped event. */
export function elapsedLabel(seconds, first) {
  if (seconds == null || first == null) return null
  let d = seconds - first
  if (d < 0) d += 86400 // crossed midnight
  const h = String(Math.floor(d / 3600)).padStart(2, '0')
  const m = String(Math.floor((d % 3600) / 60)).padStart(2, '0')
  const s = String(d % 60).padStart(2, '0')
  return `T+${h}:${m}:${s}`
}

const TYPE_WEIGHT = {
  info: 0.28, detection: 0.4, action: 0.4, resolution: 0.3,
  warning: 0.55, escalation: 0.62, alert: 0.78, error: 0.85, critical: 1,
}
const FAILURE_TYPES = new Set(['alert', 'error', 'critical'])

/**
 * Plot values for a timeline: events are placed around the dial by their share
 * of the incident's elapsed time; height follows the event type.
 */
export function timelinePlot(entries = [], bins = 120) {
  const values = Array(bins).fill(0.11)
  const secs = entries.map(e => clockSeconds(e.time))
  const first = secs.find(s => s != null) ?? null
  const rel = secs.map(s => (s == null || first == null ? null : (s - first + 86400) % 86400))
  const span = Math.max(...rel.filter(r => r != null), 1)
  const marks = []
  const taken = new Set()
  let failureMarked = false

  entries.forEach((e, i) => {
    const pos = rel[i] != null ? rel[i] / span : i / Math.max(entries.length - 1, 1)
    let bin = Math.min(bins - 1, Math.round(pos * (bins - 2)) + 1)
    // Simultaneous events get neighbouring bins so their numbers stay legible.
    while (taken.has(bin) && bin < bins - 1) bin += 2
    taken.add(bin)
    const type = String(e.type || 'action').toLowerCase()
    const w = TYPE_WEIGHT[type] ?? 0.4
    values[bin] = Math.max(values[bin], w)
    // Shoulders: each event leaves mass on its neighbours (height / (1 + 0.7 * distance)),
    // so a handful of events still draws a readable ridge. This smooths the same data; it
    // adds no variation of its own, and the peak stays exactly at the event.
    for (let d = 1; d <= 6; d += 1) {
      const shoulder = w / (1 + 0.7 * d) * 0.85
      if (bin - d >= 0) values[bin - d] = Math.max(values[bin - d], shoulder)
      if (bin + d < bins) values[bin + d] = Math.max(values[bin + d], shoulder)
    }
    const isFirstFailure = !failureMarked && FAILURE_TYPES.has(type)
    if (isFirstFailure) failureMarked = true
    marks.push({ bin, tone: isFirstFailure ? 'fail' : 'event', label: String(i + 1) })
  })
  return { values, marks, first }
}

const LEVELS = [
  [/\b(FATAL|CRITICAL|PANIC|OOMKilled|OutOfMemory)/i, 1],
  [/\b(ERROR|ERR|EXCEPTION|FAIL(ED|URE)?)\b/i, 0.82],
  [/\b(WARN|WARNING)\b/i, 0.5],
  [/\b(INFO|NOTICE)\b/i, 0.2],
  [/\bDEBUG|TRACE\b/i, 0.1],
]

/** Plot values for pasted logs: lines are binned around the dial, height = worst level in the bin. */
export function logsPlot(text = '', bins = 120) {
  const lines = String(text).split('\n').filter(l => l.trim())
  const values = Array(bins).fill(0)
  let errors = 0
  let warnings = 0
  if (lines.length === 0) return { values, marks: [], lines: 0, errors, warnings }
  lines.forEach((line, i) => {
    const bin = Math.min(bins - 1, Math.floor((i / lines.length) * bins))
    const hit = LEVELS.find(([re]) => re.test(line))
    const weight = hit ? hit[1] : 0.12
    if (weight >= 0.82) errors += 1
    else if (weight === 0.5) warnings += 1
    values[bin] = Math.max(values[bin], weight)
    for (let d = 1; d <= 2; d += 1) {
      const shoulder = weight / (1 + 0.9 * d) * 0.8
      if (bin - d >= 0) values[bin - d] = Math.max(values[bin - d], shoulder)
      if (bin + d < bins) values[bin + d] = Math.max(values[bin + d], shoulder)
    }
  })
  // A floor only once there is something to plot; an empty input stays an empty dial.
  for (let i = 0; i < bins; i += 1) values[i] = Math.max(values[i], 0.08)
  return { values, marks: [], lines: lines.length, errors, warnings }
}

const RC_LABELS = /(TRIGGER INICIAL|CASCADA|EVIDENCIA|CONCLUSI[ÓO]N)\s*:/gi
const RC_KEYS = { 'TRIGGER INICIAL': 'trigger', CASCADA: 'cascade', EVIDENCIA: 'evidence', 'CONCLUSIÓN': 'conclusion', CONCLUSION: 'conclusion' }

/**
 * Split the model's root_cause into labelled parts. Returns null when the text
 * carries no labels, so callers can fall back to plain prose.
 */
export function parseRootCause(text = '') {
  const source = String(text)
  const hits = [...source.matchAll(RC_LABELS)]
  if (hits.length === 0) return null
  const parts = []
  hits.forEach((m, i) => {
    const end = i + 1 < hits.length ? hits[i + 1].index : source.length
    const body = source.slice(m.index + m[0].length, end).trim().replace(/^[\s,;.]+|[\s]+$/g, '')
    const key = RC_KEYS[m[1].toUpperCase()]
    if (key && body) parts.push({ key, body })
  })
  return parts.length ? parts : null
}

/**
 * Evidence as discrete log lines. The model returns it as one run of text, sometimes a JSON array
 * of strings, sometimes bracketed lines joined with ";". Returns [] when it cannot be split.
 */
export function evidenceLines(body = '') {
  const text = String(body).trim()
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) return parsed.map(String).map(s => s.trim()).filter(Boolean)
    } catch { /* not JSON: fall through */ }
  }
  const pieces = text.split(/;\s*(?=\[)/).map(s => s.trim().replace(/[;\s]+$/, '')).filter(Boolean)
  return pieces.length > 1 ? pieces : []
}
