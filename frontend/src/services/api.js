const BASE = '/api'
const CLIENT_ID_KEY = 'pm-client-id'

function newClientId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

let memoryClientId = null

/**
 * Anonymous per-browser ID. The backend uses it to scope history, deletion and
 * the similarity cache, so visitors never see each other's incidents.
 */
export function getClientId() {
  try {
    let id = localStorage.getItem(CLIENT_ID_KEY)
    if (!id) {
      id = newClientId()
      localStorage.setItem(CLIENT_ID_KEY, id)
    }
    return id
  } catch {
    memoryClientId ??= newClientId()
    return memoryClientId
  }
}

const POSTMORTEM_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Builds /api/postmortems/:id only for well-formed UUIDs, so a crafted URL can't reach other API routes. */
function postmortemUrl(id) {
  if (typeof id !== 'string' || !POSTMORTEM_ID.test(id)) throw new Error('Not found')
  return `${BASE}/postmortems/${encodeURIComponent(id)}`
}

function apiFetch(url, options = {}) {
  return fetch(url, { ...options, headers: { ...options.headers, 'X-Client-Id': getClientId() } })
}

function handleStreamEvent(data, onChunk, onComplete, onError) {
  if (data.status === 'generating') {
    onChunk(data.chunk)
    return
  }

  if (data.status === 'complete') {
    onComplete(data.id, data.postmortem)
    return
  }

  if (data.status === 'error') {
    onError(data.message)
  }
}


function processStreamBuffer(buffer, onChunk, onComplete, onError) {
  const lines = buffer.split('\n')
  const remainder = lines.pop() ?? ''

  for (const line of lines) {
    if (!line.startsWith('data: ')) continue

    try {
      const data = JSON.parse(line.slice(6))
      handleStreamEvent(data, onChunk, onComplete, onError)
    } catch {}
  }

  return remainder
}


export async function analyzeLogsStream(content, onChunk, onComplete, onError) {
  const res = await apiFetch(`${BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, stream: true }),
  })
  if (!res.ok) {
    const err = await res.json()
    onError(err.error || 'Request failed')
    return
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    buffer = processStreamBuffer(buffer, onChunk, onComplete, onError)
  }
}

export async function analyzeLogs(content, { signal } = {}) {
  const res = await apiFetch(`${BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
    signal,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(body.error || 'Request failed')
    err.status = res.status
    err.retryAfter = body.retry_after ?? (Number(res.headers.get('Retry-After')) || undefined)
    throw err
  }
  return res.json()
}

export async function getPostmortems() {
  const res = await apiFetch(`${BASE}/postmortems`)
  if (!res.ok) throw new Error('Failed to fetch history')
  return res.json()
}

export async function getPostmortem(id) {
  const res = await apiFetch(postmortemUrl(id))
  if (!res.ok) throw new Error('Not found')
  return res.json()
}

export async function deletePostmortem(id) {
  const res = await apiFetch(postmortemUrl(id), { method: 'DELETE' })
  if (!res.ok) throw new Error('Delete failed')
  return res.json()
}

export async function getStats() {
  const res = await apiFetch(`${BASE}/stats`)
  if (!res.ok) return { total_postmortems: 0 }
  return res.json()
}

export async function getDashboard() {
  const res = await apiFetch(`${BASE}/dashboard`)
  if (!res.ok) return null
  return res.json()
}

function triggerDownload(url, filename) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

export async function exportMarkdown(postmortem) {
  const res = await apiFetch(`${BASE}/export/markdown`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postmortem }),
  })
  if (!res.ok) throw new Error('Error al exportar')
  const blob = await res.blob()
  triggerDownload(URL.createObjectURL(blob), `${postmortem.title?.replaceAll(/\s+/g, '_') || 'postmortem'}.md`)
}

export async function exportPDF(postmortem) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const res = await apiFetch(`${BASE}/export/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postmortem, timezone }),
  })
  if (!res.ok) throw new Error('Error al exportar')
  const blob = await res.blob()
  triggerDownload(URL.createObjectURL(blob), `${postmortem.title?.replaceAll(/\s+/g, '_') || 'postmortem'}.pdf`)
}
