import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Trash2, Inbox, ArrowRight } from 'lucide-react'
import { SeverityBadge } from '../Postmortem/SeverityBadge'

export function HistoryList({ items, onDelete }) {
  const { t, i18n } = useTranslation()

  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 py-14 text-center">
        <Inbox className="h-8 w-8 text-muted" aria-hidden="true" />
        <p className="text-lg font-medium text-text">{t('history.empty')}</p>
        <p className="max-w-sm text-sm text-muted">{t('history.emptyHint')}</p>
        <Link to="/" className="btn-primary mt-3 text-sm">
          {t('history.emptyCta')}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    )
  }

  const fmt = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      <AnimatePresence initial={false}>
        {items.map((pm) => (
            <motion.li
              key={pm.id}
              layout
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="group relative flex items-center gap-4 px-4 py-4 transition-colors hover:bg-subtle/60 sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <Link
                  to={`/result/${pm.id}`}
                  className="block truncate font-medium text-text after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                >
                  {pm.title}
                </Link>
                {pm.summary && <p className="mt-0.5 line-clamp-1 text-sm text-muted">{pm.summary}</p>}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="sm:hidden"><SeverityBadge severity={pm.severity} /></span>
                  <time dateTime={pm.created_at} className="tabular text-xs text-muted/80">
                    {fmt.format(new Date(pm.created_at))}
                  </time>
                </div>
              </div>
              <span className="hidden sm:block"><SeverityBadge severity={pm.severity} /></span>
              <button
                type="button"
                onClick={() => onDelete(pm.id)}
                aria-label={t('history.delete', { title: pm.title })}
                className="icon-btn relative z-10 hover:bg-p0/10 hover:text-p0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
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
      created_at: PropTypes.string.isRequired,
    })
  ).isRequired,
  onDelete: PropTypes.func.isRequired,
}
