import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { clockSeconds, elapsedLabel } from '../../lib/incident'

// The type label already says the level; drop a redundant English prefix for display only.
const LEVEL_PREFIX = /^\s*(CRITICAL|ERROR|WARNING|WARN|INFO)\s*:\s*/i

const FAILURE_TYPES = new Set(['alert', 'error', 'critical'])

export function Timeline({ entries = [] }) {
  const { t } = useTranslation()
  const first = entries.map(e => clockSeconds(e.time)).find(s => s != null) ?? null
  let failureShown = false

  return (
    <ol className="border-t border-border">
      {entries.map((entry, i) => {
        const type = String(entry.type || 'action').toLowerCase()
        const isFirstFailure = !failureShown && FAILURE_TYPES.has(type)
        if (isFirstFailure) failureShown = true
        const elapsed = elapsedLabel(clockSeconds(entry.time), first)
        return (
          <li
            key={`${entry.time}-${i}`}
            className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-4 border-b border-border py-4 sm:grid-cols-[2.25rem_9.5rem_minmax(0,1fr)]"
          >
            <span
              className={`flex h-7 w-7 items-center justify-center font-mono text-xs ${
                isFirstFailure ? 'bg-fac-red text-white' : 'border border-line/70 text-text'
              }`}
            >
              {i + 1}
            </span>
            <div className="col-start-2 font-mono text-xs leading-6 text-muted sm:col-start-auto">
              <time className="block text-text">{entry.time}</time>
              {elapsed && <span className="tabular">{elapsed}</span>}
            </div>
            <div className="col-start-2 mt-1 min-w-0 sm:col-start-auto sm:mt-0">
              <p className="caps flex flex-wrap items-center gap-x-3 text-muted">
                {t(`pm.eventType.${type}`, { defaultValue: entry.type })}
                {isFirstFailure && <span className="bg-fac-red px-1.5 py-px text-white">{t('catalog.firstFailure')}</span>}
              </p>
              <p className="mt-1 max-w-[56ch] text-[15px] leading-relaxed text-text">{String(entry.event ?? '').replace(LEVEL_PREFIX, '')}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

Timeline.propTypes = {
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      time: PropTypes.string,
      event: PropTypes.string,
      type: PropTypes.string,
    })
  ),
}
