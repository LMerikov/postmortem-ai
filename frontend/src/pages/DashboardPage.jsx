import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getDashboard } from '../services/api'
import { LoadingSpinner } from '../components/UI/LoadingSpinner'

const SEVERITIES = ['P0', 'P1', 'P2', 'P3', 'P4']
const SEV_FILL = { P0: 'bg-fac-red', P1: 'bg-fac-yellow', P2: 'bg-fac-blue', P3: 'bg-fac-white', P4: 'bg-fac-grey' }
const CELLS = 24

/** Segmented readout: a share of 24 cells, never a smooth bar. */
function Readout({ pct, fill, label }) {
  const lit = pct > 0 ? Math.max(1, Math.round((pct / 100) * CELLS)) : 0
  return (
    <span role="img" aria-label={label} className="flex h-3.5 gap-px">
      {Array.from({ length: CELLS }, (_, i) => (
        <span key={i} className={`flex-1 ${i < lit ? fill : 'bg-subtle'}`} />
      ))}
    </span>
  )
}

Readout.propTypes = {
  pct: PropTypes.number.isRequired,
  fill: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
}

function Row({ label, value, sub }) {
  return (
    <div className="rule-row">
      <dt className="caps text-muted">{label}</dt>
      <dd className="text-right">
        <span className="tabular font-mono text-lg text-text">{value}</span>
        {sub && <span className="ml-3 text-xs text-muted">{sub}</span>}
      </dd>
    </div>
  )
}

Row.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  sub: PropTypes.string,
}

function Bar({ label, count, pct, fill }) {
  return (
    <li className="grid grid-cols-[8.5rem_minmax(0,1fr)_5rem] items-center gap-4 border-b border-border py-3 text-sm">
      <span className="truncate text-text">{label}</span>
      <Readout pct={pct} fill={fill} label={`${label}: ${count} (${pct}%)`} />
      <span className="tabular text-right font-mono text-xs text-muted">{count} · {pct}%</span>
    </li>
  )
}

Bar.propTypes = {
  label: PropTypes.node.isRequired,
  count: PropTypes.number.isRequired,
  pct: PropTypes.number.isRequired,
  fill: PropTypes.string.isRequired,
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
        <LoadingSpinner size={24} />
        <span className="caps">{t('dashboard.loading')}</span>
      </output>
    )
  }

  if (!stats || stats.total_postmortems === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-start gap-8 px-4 py-20 sm:px-6">
        <p className="display-wide text-[clamp(3.5rem,12vw,7rem)]" aria-hidden="true">000</p>
        <div className="space-y-2">
          <h1 className="caps-lg">{t('dashboard.empty')}</h1>
          <p className="text-muted">{t('dashboard.emptyHint')}</p>
        </div>
        <Link to="/" className="btn-primary">{t('dashboard.analyze')}</Link>
      </div>
    )
  }

  const errorTypeLabel = (type) => t(`dashboard.errorTypes.${type}`, { defaultValue: type })
  const dist = stats.severity_distribution || {}
  const errorTypes = Object.entries(stats.error_types || {})
  const totalSev = Object.values(dist).reduce((a, b) => a + b, 0)
  const criticalCount = (dist.P0 || 0) + (dist.P1 || 0)
  const pctOf = (n, total) => (total > 0 ? Math.round((n / total) * 100) : 0)
  const topErrorType = errorTypes[0]

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-4">
        <h1 className="display-wide text-[clamp(2.5rem,7vw,4.5rem)] uppercase">{t('dashboard.title')}</h1>
        <p className="text-muted">{t('dashboard.subtitle')}</p>
      </header>

      <dl className="max-w-3xl border-t border-line/70">
        <Row label={t('dashboard.total')} value={stats.total_postmortems} sub={t('dashboard.totalSub')} />
        <Row
          label={t('dashboard.critical')}
          value={criticalCount}
          sub={t('dashboard.criticalSub', { pct: pctOf(criticalCount, totalSev) })}
        />
        <Row label={t('dashboard.confidence')} value={`${stats.avg_confidence ?? 0}%`} sub={t('dashboard.confidenceSub')} />
      </dl>

      <div className="grid gap-12 lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="caps-lg">{t('dashboard.bySeverity')}</h2>
          <ul className="border-t border-line/70">
            {SEVERITIES.map(sev => (
              <Bar
                key={sev}
                fill={SEV_FILL[sev]}
                label={<><span className="font-mono font-semibold">{sev}</span> <span className="text-muted">{t(`severity.${sev}`)}</span></>}
                count={dist[sev] || 0}
                pct={pctOf(dist[sev] || 0, totalSev)}
              />
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="caps-lg">{t('dashboard.byType')}</h2>
          {errorTypes.length === 0 ? (
            <p className="text-sm text-muted">{t('dashboard.noData')}</p>
          ) : (
            <ul className="border-t border-line/70">
              {errorTypes.slice(0, 7).map(([type, count]) => (
                <Bar key={type} fill="bg-fac-white" label={errorTypeLabel(type)} count={count} pct={pctOf(count, stats.total_postmortems)} />
              ))}
            </ul>
          )}
          {topErrorType && (
            <p className="text-sm text-muted">
              {t('dashboard.topType', { type: errorTypeLabel(topErrorType[0]), count: topErrorType[1] })}
            </p>
          )}
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/" className="btn-primary">{t('dashboard.analyze')}</Link>
        <Link to="/history" className="btn-secondary">{t('dashboard.history')}</Link>
      </div>
    </div>
  )
}
