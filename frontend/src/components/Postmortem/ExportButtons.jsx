import { useState } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { FileDown, FileText, Copy, Check } from 'lucide-react'
import { exportMarkdown, exportPDF } from '../../services/api'
import { useToast } from '../UI/Toast'
import { LoadingSpinner } from '../UI/LoadingSpinner'

export function ExportButtons({ postmortem }) {
  const { t } = useTranslation()
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => withLoading('pdf', 'PDF', () => exportPDF(postmortem))}
        disabled={loading.pdf}
        aria-busy={loading.pdf || undefined}
        className="btn-primary px-4 py-2 text-sm"
      >
        {loading.pdf ? <LoadingSpinner size={16} /> : <FileDown className="h-4 w-4" aria-hidden="true" />}
        {t('export.pdf')}
      </button>
      <button
        type="button"
        onClick={() => withLoading('md', 'Markdown', () => exportMarkdown(postmortem))}
        disabled={loading.md}
        aria-busy={loading.md || undefined}
        className="btn-secondary text-sm"
      >
        {loading.md ? <LoadingSpinner size={16} /> : <FileText className="h-4 w-4" aria-hidden="true" />}
        {t('export.markdown')}
      </button>
      <button type="button" onClick={copyToClipboard} className="btn-secondary text-sm">
        {copied ? <Check className="h-4 w-4 text-success" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
        {t('export.copy')}
      </button>
    </div>
  )
}

ExportButtons.propTypes = {
  postmortem: PropTypes.object.isRequired,
}
