import { useState } from 'react'
import { CheckSquare, Square } from 'lucide-react'
import { motion } from 'framer-motion'

const PRIORITY_STYLES = {
  HIGH:   'text-p0 bg-p0/10 border-p0/30',
  MEDIUM: 'text-p2 bg-p2/10 border-p2/30',
  LOW:    'text-success bg-success/10 border-success/30',
}

export function ActionItems({ items = [] }) {
  const [checked, setChecked] = useState({})

  const toggle = (i) => setChecked(prev => ({ ...prev, [i]: !prev[i] }))

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className={`flex items-start gap-3 p-3 rounded-lg border border-border bg-input transition-opacity ${checked[i] ? 'opacity-50' : ''}`}
        >
          <button onClick={() => toggle(i)} className="mt-0.5 text-muted hover:text-accent transition-colors flex-shrink-0">
            {checked[i] ? <CheckSquare className="w-5 h-5 text-success" /> : <Square className="w-5 h-5" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${checked[i] ? 'line-through text-muted' : 'text-text'}`}>
              {item.description}
            </p>
            <p className="text-xs text-muted mt-0.5">Owner: {item.owner || 'TBD'}</p>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded border flex-shrink-0 ${PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.MEDIUM}`}>
            {item.priority}
          </span>
        </motion.div>
      ))}
    </div>
  )
}
