import { useState } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'

const PRIORITY_STYLES = {
  HIGH:   'text-p0 bg-p0/10 border-p0/30',
  MEDIUM: 'text-p2 bg-p2/10 border-p2/30',
  LOW:    'text-success bg-success/10 border-success/30',
}

export function ActionItems({ items = [] }) {
  const { t } = useTranslation()
  const [checked, setChecked] = useState({})

  const toggle = (i) => setChecked(prev => ({ ...prev, [i]: !prev[i] }))

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-input">
      {items.map((item, i) => {
        const done = Boolean(checked[i])
        const priority = PRIORITY_STYLES[item.priority] ? item.priority : 'MEDIUM'
        return (
          <li key={`${i}-${item.description}`} className="flex items-start gap-3 p-4">
            <span className="relative mt-0.5 flex h-5 w-5 shrink-0">
              <input
                type="checkbox"
                checked={done}
                onChange={() => toggle(i)}
                aria-labelledby={`action-item-${i}`}
                title={done ? t('pm.markPending') : t('pm.markDone')}
                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-muted/50 transition-colors hover:border-accent-strong checked:border-success checked:bg-success/20"
              />
              <Check
                className="pointer-events-none absolute inset-0 m-auto hidden h-3.5 w-3.5 text-success peer-checked:block"
                aria-hidden="true"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p id={`action-item-${i}`} className={`text-sm leading-relaxed ${done ? 'text-muted line-through' : 'text-text'}`}>
                {item.description}
              </p>
              <p className="mt-1 text-xs text-muted">
                {t('pm.owner', { owner: item.owner || t('pm.ownerTbd') })}
              </p>
            </div>
            <span className={`shrink-0 rounded border px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[priority]}`}>
              {t(`pm.priority.${priority}`)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

ActionItems.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      description: PropTypes.string,
      owner: PropTypes.string,
      priority: PropTypes.string,
    })
  ),
}
