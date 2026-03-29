const BASE = '/api'

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
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6))
          if (data.status === 'generating') onChunk(data.chunk)
          else if (data.status === 'complete') onComplete(data.id, data.postmortem)
          else if (data.status === 'error') onError(data.message)
        } catch {}
      }
    }
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
  // El unico metodo confiable cross-browser: <a download> adjunto al DOM
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Liberar la blob URL despues del click
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
  // Obtener la zona horaria del navegador del usuario (ej: "America/Santiago")
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
