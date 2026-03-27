import PropTypes from 'prop-types'
import { motion } from 'framer-motion'

const TYPE_CONFIG = {
  alert:      { icon: '🚨', color: 'border-p0/50 bg-p0/10',    dot: 'bg-p0' },
  detection:  { icon: '🔍', color: 'border-p3/50 bg-p3/10',    dot: 'bg-p3' },
  escalation: { icon: '📣', color: 'border-p1/50 bg-p1/10',    dot: 'bg-p1' },
  action:     { icon: '⚡', color: 'border-accent/50 bg-accent/10', dot: 'bg-accent' },
  resolution: { icon: '✅', color: 'border-success/50 bg-success/10', dot: 'bg-success' },
}

export function Timeline({ entries = [] }) {
  return (
    <div className="space-y-3">
      {entries.map((entry, i) => {
        const cfg = TYPE_CONFIG[entry.type] || TYPE_CONFIG.action
        return (
          <motion.div
            key={`${entry.time}-${entry.event}`}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className="flex gap-4 items-start"
          >
            {/* Timeline line */}
            <div className="flex flex-col items-center gap-1 pt-1">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${cfg.dot}`} />
              {i < entries.length - 1 && <div className="w-px h-full min-h-6 bg-border" />}
            </div>
            {/* Content */}
            <div className={`flex-1 border rounded-lg px-4 py-2.5 ${cfg.color}`}>
              {/* Fila 1: tiempo + badge tipo */}
              <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                <span className="font-mono text-xs text-muted bg-code px-2 py-0.5 rounded">
                  {entry.time}
                </span>
                <span className="text-xs text-muted capitalize flex items-center gap-1">
                  {cfg.icon} {entry.type}
                </span>
              </div>
              {/* Fila 2: evento */}
              <p className="text-sm text-text leading-snug">{entry.event}</p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

Timeline.propTypes = {
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      time: PropTypes.string.isRequired,
      event: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['alert', 'detection', 'escalation', 'action', 'resolution']),
    })
  ),
}

Timeline.defaultProps = {
  entries: [],
}
