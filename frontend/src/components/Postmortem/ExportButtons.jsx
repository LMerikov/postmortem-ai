import { useState } from 'react'
import PropTypes from 'prop-types'
import { FileDown, FileText, Copy } from 'lucide-react'
import { exportMarkdown, exportPDF } from '../../services/api'
import { useToast } from '../UI/Toast'
import { LoadingSpinner } from '../UI/LoadingSpinner'

export function ExportButtons({ postmortem }) {
  const toast = useToast()
  const [loading, setLoading] = useState({})

  const withLoading = async (key, label, fn) => {
    setLoading(p => ({ ...p, [key]: true }))
    try {
      await fn()
      toast(`${label} descargado`, 'success')
    } catch (e) {
      toast(e.message || 'Error al exportar', 'error')
    } finally {
      setLoading(p => ({ ...p, [key]: false }))
    }
  }

  const copyToClipboard = async () => {
    const text = JSON.stringify(postmortem, null, 2)
    await navigator.clipboard.writeText(text)
    toast('¡Copiado al portapapeles!', 'success')
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => withLoading('md', 'Markdown', () => exportMarkdown(postmortem))}
        disabled={loading.md}
        className="btn-secondary text-sm"
      >
        {loading.md ? <LoadingSpinner size={16} /> : <FileText className="w-4 h-4" />}
        Markdown
      </button>
      <button
        onClick={() => withLoading('pdf', 'PDF', () => exportPDF(postmortem))}
        disabled={loading.pdf}
        className="btn-secondary text-sm"
      >
        {loading.pdf ? <LoadingSpinner size={16} /> : <FileDown className="w-4 h-4" />}
        PDF
      </button>
      <button onClick={copyToClipboard} className="btn-secondary text-sm">
        <Copy className="w-4 h-4" />
        Copiar
      </button>
    </div>
  )
}

ExportButtons.propTypes = {
  postmortem: PropTypes.shape({
    title: PropTypes.string,
    severity: PropTypes.string,
    summary: PropTypes.string,
    timeline: PropTypes.array,
    root_cause: PropTypes.string,
    impact: PropTypes.object,
    actions_taken: PropTypes.array,
    action_items: PropTypes.array,
    lessons_learned: PropTypes.array,
    monitoring_recommendations: PropTypes.array,
  }).isRequired,
}
