import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Lock } from 'lucide-react'
import { HistoryList } from '../components/History/HistoryList'
import { LoadingSpinner } from '../components/UI/LoadingSpinner'
import { getPostmortems, deletePostmortem } from '../services/api'
import { useToast } from '../components/UI/Toast'

const UNDO_WINDOW = 6000

export function HistoryPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')
  const pending = useRef(new Map())

  useEffect(() => {
    getPostmortems()
      .then(data => { setItems(data); setStatus('ready') })
      .catch(() => setStatus('error'))
  }, [])

  // Commit any deletions still waiting on the undo window when leaving the page.
  useEffect(() => () => {
    pending.current.forEach(({ timer }, id) => {
      clearTimeout(timer)
      deletePostmortem(id).catch(() => {})
    })
  }, [])

  const handleDelete = useCallback((id) => {
    const index = items.findIndex(p => p.id === id)
    if (index === -1) return
    const item = items[index]
    setItems(prev => prev.filter(p => p.id !== id))

    const restore = () => setItems(prev => {
      const next = [...prev]
      next.splice(Math.min(index, next.length), 0, item)
      return next
    })

    const timer = setTimeout(async () => {
      pending.current.delete(id)
      try {
        await deletePostmortem(id)
      } catch {
        restore()
        toast(t('history.deleteError'), 'error')
      }
    }, UNDO_WINDOW)
    pending.current.set(id, { timer })

    toast(t('history.deleted'), 'success', {
      duration: UNDO_WINDOW,
      action: {
        label: t('history.undo'),
        onClick: () => {
          clearTimeout(pending.current.get(id)?.timer)
          pending.current.delete(id)
          restore()
        },
      },
    })
  }, [items, toast, t])

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <header className="space-y-2">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">{t('history.title')}</h1>
          {status === 'ready' && items.length > 0 && (
            <p className="tabular text-sm text-muted">{t('history.count', { count: items.length })}</p>
          )}
        </div>
        <p className="flex items-center gap-2 text-sm text-muted">
          <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t('history.privacy')}
        </p>
      </header>

      {status === 'loading' && (
        <div className="flex justify-center py-16"><LoadingSpinner size={28} /></div>
      )}
      {status === 'error' && (
        <div role="alert" className="flex items-center gap-3 rounded-lg border border-p0/30 bg-p0/10 px-4 py-3 text-sm text-p0">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t('history.loadError')}
        </div>
      )}
      {status === 'ready' && <HistoryList items={items} onDelete={handleDelete} />}
    </div>
  )
}
