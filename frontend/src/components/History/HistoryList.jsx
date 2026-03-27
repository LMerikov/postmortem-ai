import { motion } from 'framer-motion'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { Trash2, ExternalLink, FlaskConical, Zap } from 'lucide-react'
import { SeverityBadge } from '../Postmortem/SeverityBadge'

export function HistoryList({ items, onDelete }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-muted">
        <p className="text-4xl mb-4">📭</p>
        <p className="text-lg font-medium">Aún no hay postmortems</p>
        <p className="text-sm mt-1">Analiza logs o ejecuta una simulación para comenzar</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((pm, i) => (
        <motion.div
          key={pm.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="card flex items-center gap-4 hover:border-accent/40 transition-colors group"
        >
          <div className="flex-shrink-0">
            {pm.source === 'simulate'
              ? <FlaskConical className="w-5 h-5 text-cyan" />
              : <Zap className="w-5 h-5 text-accent" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-text font-medium truncate">{pm.title}</p>
            <p className="text-xs text-muted mt-0.5 line-clamp-1">{pm.summary}</p>
            <p className="text-xs text-muted/60 mt-1">
              {new Date(pm.created_at).toLocaleString()}
            </p>
          </div>
          <SeverityBadge severity={pm.severity} />
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              to={`/result/${pm.id}`}
              className="p-2 text-muted hover:text-accent rounded-lg hover:bg-accent/10 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
            <button
              onClick={() => onDelete(pm.id)}
              className="p-2 text-muted hover:text-p0 rounded-lg hover:bg-p0/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

HistoryList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      summary: PropTypes.string,
      severity: PropTypes.string,
      source: PropTypes.string,
      created_at: PropTypes.string.isRequired,
    })
  ).isRequired,
  onDelete: PropTypes.func.isRequired,
}
