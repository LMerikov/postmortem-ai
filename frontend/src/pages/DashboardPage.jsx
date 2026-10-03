import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BarChart2, ArrowRight } from 'lucide-react'
import { getDashboard } from '../services/api'
import { LoadingSpinner } from '../components/UI/LoadingSpinner'

const SEVERITIES = ['P0', 'P1', 'P2', 'P3', 'P4']
const SEV_TEXT = { P0: 'text-p0', P1: 'text-p1', P2: 'text-p2', P3: 'text-p3', P4: 'text-p4' }
const EASE = [0.16, 1, 0.3, 1]

function Stat({ label, value, sub }) {
  return (
    <div className="space-y-1 bg-card p-5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="tabular text-3xl font-semibold tracking-tight text-text">{value}</dd>
      {sub && <dd className="text-xs text-muted">{sub}</dd>}
    </div>
  )
}

Stat.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  sub: PropTypes.string,
}

function Bar({ label, labelClass = 'text-text', tone = '', count, pct }) {
  return (
    <li className={`${tone} grid grid-cols-[7.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 text-sm`}>
      <span className={`truncate ${labelClass}`}>{label}</span>
      <span className="h-2 overflow-hidden rounded-full bg-input">
        <motion.span
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: EASE }}
          className="block h-full rounded-full bg-current opacity-80"
        />
      </span>
      <span className="tabular text-right text-xs text-muted">{count} · {pct}%</span>
    </li>
  )
}

Bar.propTypes = {
  label: PropTypes.node.isRequired,
  labelClass: PropTypes.string,
  tone: PropTypes.string,
  count: PropTypes.number.isRequired,
  pct: PropTypes.number.isRequired,
}

export function DashboardPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <output className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-20 text-muted">
        <LoadingSpinner size={28} />
        <span className="text-sm">{t('dashboard.loading')}</span>
      </output>
    )
  }

  if (!stats || stats.total_postmortems === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <BarChart2 className="mx-auto h-10 w-10 text-muted" aria-hidden="true" />
        <p className="mt-4 text-lg font-medium text-text">{t('dashboard.empty')}</p>
        <p className="mt-1 text-sm text-muted">{t('dashboard.emptyHint')}</p>
        <Link to="/" className="btn-primary mt-6">
          {t('dashboard.analyze')}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    )
  }

  const dist = stats.severity_distribution || {}
  const errorTypes = Object.entries(stats.error_types || {})
  const totalSev = Object.values(dist).reduce((a, b) => a + b, 0)
  const criticalCount = (dist.P0 || 0) + (dist.P1 || 0)
  const pctOf = (n, total) => (total > 0 ? Math.round((n / total) * 100) : 0)
  const topErrorType = errorTypes[0]

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted">{t('dashboard.subtitle')}</p>
      </header>

      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
        <Stat label={t('dashboard.total')} value={stats.total_postmortems} sub={t('dashboard.totalSub')} />
        <Stat
          label={t('dashboard.critical')}
          value={criticalCount}
          sub={t('dashboard.criticalSub', { pct: pctOf(criticalCount, totalSev) })}
        />
        <Stat label={t('dashboard.confidence')} value={`${stats.avg_confidence ?? 0}%`} sub={t('dashboard.confidenceSub')} />
      </dl>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card space-y-5">
          <h2 className="font-medium">{t('dashboard.bySeverity')}</h2>
          <ul className="space-y-3">
            {SEVERITIES.map(sev => (
              <Bar
                key={sev}
                tone={SEV_TEXT[sev]}
                labelClass={SEV_TEXT[sev]}
                label={<><span className="font-mono font-semibold">{sev}</span> <span className="text-muted">{t(`severity.${sev}`)}</span></>}
                count={dist[sev] || 0}
                pct={pctOf(dist[sev] || 0, totalSev)}
              />
            ))}
          </ul>
        </section>

        <section className="card space-y-5">
          <h2 className="font-medium">{t('dashboard.byType')}</h2>
          {errorTypes.length === 0 ? (
            <p className="text-sm text-muted">{t('dashboard.noData')}</p>
          ) : (
            <ul className="space-y-3">
              {errorTypes.slice(0, 7).map(([type, count]) => (
                <Bar key={type} tone="text-accent-strong" label={type} count={count} pct={pctOf(count, stats.total_postmortems)} />
              ))}
            </ul>
          )}
          {topErrorType && (
            <p className="border-t border-border pt-4 text-xs text-muted">
              {t('dashboard.topType', { type: topErrorType[0], count: topErrorType[1] })}
            </p>
          )}
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/" className="btn-primary">
          {t('dashboard.analyze')}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link to="/history" className="btn-secondary">{t('dashboard.history')}</Link>
      </div>
    </div>
  )
}
