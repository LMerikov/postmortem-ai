import PropTypes from 'prop-types'

const SEVERITY_CONFIG = {
  P0: { label: 'P0 Critical', color: 'text-p0 border-p0/30 bg-p0/10' },
  P1: { label: 'P1 High',     color: 'text-p1 border-p1/30 bg-p1/10' },
  P2: { label: 'P2 Medium',   color: 'text-p2 border-p2/30 bg-p2/10' },
  P3: { label: 'P3 Low',      color: 'text-p3 border-p3/30 bg-p3/10' },
  P4: { label: 'P4 Info',     color: 'text-p4 border-p4/30 bg-p4/10' },
}

export function SeverityBadge({ severity, size = 'md' }) {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.P3
  const sizeClass = size === 'lg' ? 'text-base px-4 py-1.5' : 'text-xs px-2.5 py-1'
  return (
    <span className={`severity-badge font-mono ${cfg.color} ${sizeClass}`}>
      {cfg.label}
    </span>
  )
}

SeverityBadge.propTypes = {
  severity: PropTypes.oneOf(['P0', 'P1', 'P2', 'P3', 'P4']),
  size: PropTypes.oneOf(['md', 'lg']),
}

SeverityBadge.defaultProps = {
  severity: 'P3',
  size: 'md',
}
