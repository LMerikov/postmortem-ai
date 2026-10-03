import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { SeverityBadge } from '../Postmortem/SeverityBadge'
import { SignalPlot } from '../Catalog/SignalPlot'
import { ColorStrip } from '../Catalog/ColorStrip'
import { incidentCode, timelinePlot } from '../../lib/incident'
import { useReviewedIds } from '../../lib/review'

export function HistoryList({ items, onDelete }) {
  const { t, i18n } = useTranslation()
  const reviewedIds = useReviewedIds()

  if (items.length === 0) {
    return (
      <div className="space-y-6 border border-line/70 p-8 sm:p-12">
        <p className="display-wide text-[clamp(3rem,10vw,6rem)]" aria-hidden="true">INC 0000</p>
        <div className="space-y-2">
          <p className="caps-lg">{t('history.empty')}</p>
          <p className="max-w-[48ch] text-muted">{t('history.emptyHint')}</p>
        </div>
        <Link to="/" className="btn-primary">{t('history.emptyCta')}</Link>
      </div>
    )
  }

  const fmt = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <ul className="border-t border-line/70">
      <AnimatePresence initial={false}>
        {items.map((pm) => (
          <motion.li
            key={pm.id}
            layout
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="group relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2 border-b border-border px-1 py-5 transition-colors hover:bg-subtle sm:grid-cols-[7.5rem_4.5rem_minmax(0,1fr)_auto_auto]"
          >
            <div className="col-span-2 space-y-2 sm:col-span-1" aria-hidden="true">
              <span className="display-wide block text-2xl text-muted transition-colors group-hover:text-text sm:text-[1.7rem]">
                {incidentCode(pm.id)}
              </span>
              <ColorStrip active={pm.severity} className="[&>li]:h-1.5 [&>li]:w-4" />
            </div>
            <SignalPlot
              values={timelinePlot(pm.timeline || []).values}
              label={t('catalog.plotLabel', { count: pm.timeline?.length || 0 })}
              compact
              className="hidden h-[4.5rem] w-[4.5rem] sm:block"
            />
            <div className="min-w-0">
              <Link
                to={`/result/${pm.id}`}
                className="block truncate text-[17px] font-medium text-text after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
              >
                <span className="sr-only">INC {incidentCode(pm.id)} · </span>
                {pm.title}
              </Link>
              {pm.summary && <p className="mt-1 line-clamp-1 text-sm text-muted">{pm.summary}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <time dateTime={pm.created_at} className="tabular font-mono text-xs text-muted">
                  {fmt.format(new Date(pm.created_at))}
                </time>
                <span className="caps inline-flex items-center gap-2 text-muted">
                  <span className={`h-2.5 w-2.5 border border-line/80 ${reviewedIds.has(pm.id) ? 'bg-text' : ''}`} aria-hidden="true" />
                  {reviewedIds.has(pm.id) ? t('review.reviewed') : t('review.pending')}
                </span>
              </div>
            </div>
            <span className="hidden sm:block"><SeverityBadge severity={pm.severity} /></span>
            <button
              type="button"
              onClick={() => onDelete(pm.id)}
              aria-label={t('history.delete', { title: pm.title })}
              className="icon-btn relative z-10 hover:bg-fac-red hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <span className="col-span-2 sm:hidden"><SeverityBadge severity={pm.severity} /></span>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
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
      timeline: PropTypes.arrayOf(PropTypes.shape({ time: PropTypes.string, type: PropTypes.string })),
      created_at: PropTypes.string.isRequired,
    })
  ).isRequired,
  onDelete: PropTypes.func.isRequired,
}
