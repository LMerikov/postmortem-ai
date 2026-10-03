import { useEffect, useState } from 'react'

// Review state lives only in this browser: which follow-up tasks are ticked and whether the
// person marked the draft as reviewed. It stores no incident content, only ids and flags.
const PREFIX = 'pm-review:'
const EVENT = 'pm-review-change'
const memory = new Map() // fallback when localStorage is blocked (private windows, cleared site data)

function readRaw(id) {
  try {
    const raw = localStorage.getItem(PREFIX + id)
    if (raw) return JSON.parse(raw)
  } catch { /* fall back to memory */ }
  return memory.get(id) ?? {}
}

export function getReview(id) {
  const r = readRaw(id)
  return {
    checked: r.checked && typeof r.checked === 'object' ? r.checked : {},
    reviewedAt: typeof r.reviewedAt === 'string' ? r.reviewedAt : null,
  }
}

function notify(id) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { id } }))
}

export function saveReview(id, patch) {
  if (!id) return
  const next = { ...getReview(id), ...patch }
  memory.set(id, next)
  try { localStorage.setItem(PREFIX + id, JSON.stringify(next)) } catch { /* memory keeps it for this session */ }
  notify(id)
}

export function clearReview(id) {
  memory.delete(id)
  try { localStorage.removeItem(PREFIX + id) } catch { /* nothing to remove */ }
  notify(id)
}

function reviewedIds() {
  const ids = new Set()
  memory.forEach((v, id) => { if (v.reviewedAt) ids.add(id) })
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (key?.startsWith(PREFIX) && JSON.parse(localStorage.getItem(key) || '{}').reviewedAt) {
        ids.add(key.slice(PREFIX.length))
      }
    }
  } catch { /* storage unavailable */ }
  return ids
}

function useChangeSignal(read) {
  const [value, setValue] = useState(read)
  useEffect(() => {
    const sync = () => setValue(read())
    sync()
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return value
}

/** Review state of one incident; re-renders on changes from this or another tab. */
export function useReview(id) {
  const [review, setReview] = useState(() => getReview(id))
  useEffect(() => {
    const sync = () => setReview(getReview(id))
    sync()
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [id])
  return review
}

/** Ids of every incident this browser has marked as reviewed. */
export function useReviewedIds() {
  return useChangeSignal(reviewedIds)
}
