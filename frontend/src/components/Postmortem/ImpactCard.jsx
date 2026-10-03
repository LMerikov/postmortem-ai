import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

// The model answers "Unknown" in English whatever the UI language; treat it as missing.
const MISSING = /^(unknown|desconocido|n\/?a|none|ninguno)$/i
const clean = (v) => (v == null || MISSING.test(String(v).trim()) ? '' : v)

export function ImpactCard({ impact = {} }) {
  const { t } = useTranslation()
  const items = [
    { label: t('pm.usersAffected'), value: clean(impact.users_affected) },
    { label: t('pm.duration'), value: clean(impact.duration) },
    { label: t('pm.services'), value: (impact.services_affected || []).filter(s => !MISSING.test(String(s).trim())).join(', ') },
    { label: t('pm.revenue'), value: clean(impact.revenue_impact) },
  ]
  return (
    <dl className="grid border-t border-border sm:grid-cols-2 sm:gap-x-10">
      {items.map(({ label, value }) => (
        <div key={label} className="rule-row">
          <dt className="caps shrink-0 text-muted">{label}</dt>
          <dd className={`text-right text-[15px] ${value ? 'text-text' : 'text-muted'}`}>{value || t('pm.unknown')}</dd>
        </div>
      ))}
    </dl>
  )
}

ImpactCard.propTypes = {
  impact: PropTypes.shape({
    users_affected: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    duration: PropTypes.string,
    services_affected: PropTypes.arrayOf(PropTypes.string),
    revenue_impact: PropTypes.string,
  }),
}
