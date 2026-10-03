import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { LoadingSpinner } from './LoadingSpinner'

const clock = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

/**
 * Status of a running analysis. No invented stages: it shows the real elapsed
 * time since the request began, and, when the free plan is rate limited, the
 * real countdown to the automatic retry. The parent keeps it mounted across
 * retries so the elapsed counter never resets.
 */
export function AnalysisStatus({ retryIn = 0, onCancel }) {
  const { t } = useTranslation()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const waiting = retryIn > 0

  return (
    <div role="status" aria-live="polite" className="space-y-4 border border-line/70 bg-input p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="caps-lg flex items-center gap-3">
          <LoadingSpinner size={14} />
          {waiting ? t('home.rateWait', { seconds: retryIn }) : t('home.analyzing')}
        </p>
        <time className="tabular font-mono text-sm text-text" aria-label={t('home.elapsed')}>{clock(elapsed)}</time>
      </div>
      <p className="text-sm leading-relaxed text-muted">{t('home.waitHint')}</p>
      <button type="button" onClick={onCancel} className="btn-secondary">{t('home.cancel')}</button>
    </div>
  )
}

AnalysisStatus.propTypes = {
  retryIn: PropTypes.number,
  onCancel: PropTypes.func.isRequired,
}
