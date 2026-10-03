import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { saveReview, useReview } from '../../lib/review'

const PRIORITY = {
  HIGH:   { block: 'bg-fac-red', ink: 'text-white' },
  MEDIUM: { block: 'bg-fac-yellow', ink: 'text-black' },
  LOW:    { block: 'bg-fac-grey', ink: 'text-black' },
}

export function ActionItems({ items = [], incidentId = '' }) {
  const { t } = useTranslation()
  const { checked } = useReview(incidentId)

  const toggle = (i) => saveReview(incidentId, { checked: { ...checked, [i]: !checked[i] } })

  return (
    <>
    <ul className="border-t border-border">
      {items.map((item, i) => {
        const done = Boolean(checked[i])
        const priority = PRIORITY[item.priority] ? item.priority : 'MEDIUM'
        const p = PRIORITY[priority]
        return (
          <li key={`${i}-${item.description}`} className="flex items-start gap-4 border-b border-border py-4">
            <span className="relative mt-0.5 flex h-5 w-5 shrink-0">
              <input
                type="checkbox"
                checked={done}
                onChange={() => toggle(i)}
                aria-labelledby={`action-item-${i}`}
                title={done ? t('pm.markPending') : t('pm.markDone')}
                className="peer h-5 w-5 cursor-pointer appearance-none border border-line/80 transition-colors hover:border-text checked:border-text checked:bg-text"
              />
              <Check
                className="pointer-events-none absolute inset-0 m-auto hidden h-3.5 w-3.5 text-bg peer-checked:block"
                aria-hidden="true"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p id={`action-item-${i}`} className={`max-w-[56ch] text-[15px] leading-relaxed ${done ? 'text-muted line-through' : 'text-text'}`}>
                {item.description}
              </p>
              <p className="mt-1 text-xs text-muted">
                {t('pm.owner', { owner: item.owner || t('pm.ownerTbd') })}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-stretch border border-line/70 caps">
              <span className={`w-2 ${p.block}`} aria-hidden="true" />
              <span className="px-2 py-1">{t(`pm.priority.${priority}`)}</span>
            </span>
          </li>
        )
      })}
    </ul>
      <p className="mt-3 text-[13px] leading-relaxed text-muted">{t('review.localNote')}</p>
    </>
  )
}

ActionItems.propTypes = {
  incidentId: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      description: PropTypes.string,
      owner: PropTypes.string,
      priority: PropTypes.string,
    })
  ),
}
