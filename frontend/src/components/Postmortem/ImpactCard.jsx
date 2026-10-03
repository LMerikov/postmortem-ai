import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { Users, Clock, Server, DollarSign } from 'lucide-react'

export function ImpactCard({ impact = {} }) {
  const { t } = useTranslation()
  const items = [
    { Icon: Users,      label: t('pm.usersAffected'), value: impact.users_affected },
    { Icon: Clock,      label: t('pm.duration'),      value: impact.duration },
    { Icon: Server,     label: t('pm.services'),      value: (impact.services_affected || []).join(', ') },
    { Icon: DollarSign, label: t('pm.revenue'),       value: impact.revenue_impact },
  ]
  return (
    <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
      {items.map(({ Icon, label, value }) => (
        <div key={label} className="space-y-1 bg-input p-4">
          <dt className="flex items-center gap-2 text-xs text-muted">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />{label}
          </dt>
          <dd className={`text-sm font-medium leading-snug ${value ? 'text-text' : 'text-muted'}`}>
            {value || t('pm.unknown')}
          </dd>
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
