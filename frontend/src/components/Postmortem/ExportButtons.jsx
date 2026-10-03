import { useState } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { exportMarkdown, exportPDF } from '../../services/api'
import { useToast } from '../UI/Toast'
import { LoadingSpinner } from '../UI/LoadingSpinner'
import { useMediaQuery } from '../../lib/useMediaQuery'

export function ExportButtons({ postmortem, severity = '', alwaysOpen = false }) {
  const { t } = useTranslation()
  const wide = useMediaQuery('(min-width: 1024px)')
  const [expanded, setExpanded] = useState(false)
  const toast = useToast()
  const [loading, setLoading] = useState({})
  const [copied, setCopied] = useState(false)

  const withLoading = async (key, label, fn) => {
    setLoading(p => ({ ...p, [key]: true }))
    try {
      await fn()
      toast(t('export.downloaded', { format: label }), 'success')
    } catch {
      toast(t('export.error'), 'error')
    } finally {
      setLoading(p => ({ ...p, [key]: false }))
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(postmortem, null, 2))
      setCopied(true)
      toast(t('export.copied'), 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast(t('export.error'), 'error')
    }
  }

  const collapsed = !wide && !alwaysOpen && !expanded

  if (collapsed) {
    // Below lg the header carries one "Exportar" control instead of three buttons.
    return (
      <button type="button" aria-expanded="false" onClick={() => setExpanded(true)} className={`btn-primary ${severity === 'P0' ? 'after:bg-text hover:after:bg-bg' : ''}`}>
        {t('export.title')}
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => withLoading('pdf', 'PDF', () => exportPDF(postmortem))}
        disabled={loading.pdf}
        aria-busy={loading.pdf || undefined}
        className={`btn-primary ${severity === 'P0' ? 'after:bg-text hover:after:bg-bg' : ''}`}
      >
        {loading.pdf && <LoadingSpinner size={14} />}
        {t('export.pdf')}
      </button>
      <button
        type="button"
        onClick={() => withLoading('md', 'Markdown', () => exportMarkdown(postmortem))}
        disabled={loading.md}
        aria-busy={loading.md || undefined}
        className="btn-secondary"
      >
        {loading.md && <LoadingSpinner size={14} />}
        {t('export.markdown')}
      </button>
      <button type="button" onClick={copyToClipboard} className="btn-secondary">
        {copied ? t('common.copiedShort') : t('export.copy')}
      </button>
    </div>
  )
}

ExportButtons.propTypes = {
  postmortem: PropTypes.object.isRequired,
  severity: PropTypes.string,
  alwaysOpen: PropTypes.bool,
}
