import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { saveReview, useReview } from '../../lib/review'

/** Top note: the draft warning, or, once reviewed, who/when (this browser only). */
export function ReviewNote({ incidentId }) {
  const { t, i18n } = useTranslation()
  const { reviewedAt } = useReview(incidentId)
  if (!reviewedAt) return <p className="max-w-[56ch] text-[15px] leading-relaxed text-muted">{t('draft.note')}</p>
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(reviewedAt))
  return <p className="max-w-[56ch] text-[15px] leading-relaxed text-text">{t('review.reviewedNote', { date })}</p>
}

ReviewNote.propTypes = { incidentId: PropTypes.string }

/** Closing step of the review: a deliberate human mark, saved only in this browser. */
export function ReviewClose({ incidentId }) {
  const { t } = useTranslation()
  const { reviewedAt } = useReview(incidentId)
  const reviewed = Boolean(reviewedAt)
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <button
        type="button"
        aria-pressed={reviewed}
        onClick={() => saveReview(incidentId, { reviewedAt: reviewed ? null : new Date().toISOString() })}
        className="btn-secondary"
      >
        <span className={`flex h-4 w-4 items-center justify-center border border-line/80 ${reviewed ? 'bg-text text-bg' : ''}`} aria-hidden="true">
          {reviewed && <Check className="h-3 w-3" />}
        </span>
        {reviewed ? t('review.reviewed') : t('review.markReviewed')}
      </button>
      <p className="max-w-[48ch] text-[13px] leading-relaxed text-muted">
        {reviewed ? t('review.undoHint') : t('review.closeHint')}
      </p>
    </div>
  )
}

ReviewClose.propTypes = { incidentId: PropTypes.string }
