import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

const SEVERITY_COLOR = {
  P0: 'text-p0 border-p0/35 bg-p0/10',
  P1: 'text-p1 border-p1/35 bg-p1/10',
  P2: 'text-p2 border-p2/35 bg-p2/10',
  P3: 'text-p3 border-p3/35 bg-p3/10',
  P4: 'text-p4 border-p4/35 bg-p4/10',
}

const DOT = { P0: 'bg-p0', P1: 'bg-p1', P2: 'bg-p2', P3: 'bg-p3', P4: 'bg-p4' }

export function SeverityBadge({ severity = 'P3', size = 'md' }) {
  const { t } = useTranslation()
  const sev = SEVERITY_COLOR[severity] ? severity : 'P3'
  const sizeClass = size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5'
  return (
    <span className={`severity-badge whitespace-nowrap ${SEVERITY_COLOR[sev]} ${sizeClass}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[sev]}`} aria-hidden="true" />
      <span className="font-mono font-semibold">{sev}</span>
      <span>{t(`severity.${sev}`)}</span>
    </span>
  )
}

SeverityBadge.propTypes = {
  severity: PropTypes.string,
  size: PropTypes.oneOf(['md', 'lg']),
}
