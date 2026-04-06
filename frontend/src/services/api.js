const BASE = '/api'

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
  const res = await fetch(`${BASE}/analyze`, {
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

export async function analyzeLogs(content) {
  const res = await fetch(`${BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed')
  return res.json()
}

export async function simulate(params) {
  const res = await fetch(`${BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed')
  return res.json()
}

export async function getPostmortems() {
  const res = await fetch(`${BASE}/postmortems`)
  if (!res.ok) throw new Error('Failed to fetch history')
  return res.json()
}

export async function getPostmortem(id) {
  const res = await fetch(`${BASE}/postmortems/${id}`)
  if (!res.ok) throw new Error('Not found')
  return res.json()
}

export async function deletePostmortem(id) {
  const res = await fetch(`${BASE}/postmortems/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Delete failed')
  return res.json()
}

export async function getStats() {
  const res = await fetch(`${BASE}/stats`)
  if (!res.ok) return { total_postmortems: 0 }
  return res.json()
}

export async function getDashboard() {
  const res = await fetch(`${BASE}/dashboard`)
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
  const res = await fetch(`${BASE}/export/markdown`, {
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
  const res = await fetch(`${BASE}/export/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postmortem, timezone }),
  })
  if (!res.ok) throw new Error('Error al exportar')
  const blob = await res.blob()
  triggerDownload(URL.createObjectURL(blob), `${postmortem.title?.replaceAll(/\s+/g, '_') || 'postmortem'}.pdf`)
}
