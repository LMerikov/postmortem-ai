import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

/** Severity legend in code order P4 → P0. `active` lifts one block; nothing here is decorative. */
const BLOCKS = [
  { sev: 'P4', fill: 'bg-fac-grey' },
  { sev: 'P3', fill: 'bg-fac-white' },
  { sev: 'P2', fill: 'bg-fac-blue' },
  { sev: 'P1', fill: 'bg-fac-yellow' },
  { sev: 'P0', fill: 'bg-fac-red' },
]

export function ColorStrip({ active, className = '' }) {
  const { t } = useTranslation()
  return (
    <ul className={`flex gap-1 ${className}`} aria-label={t('catalog.severityScale')}>
      {BLOCKS.map(({ sev, fill }) => (
        <li
          key={sev}
          title={`${sev} ${t(`severity.${sev}`)}`}
          className={`h-2.5 w-9 ${fill} ${active && active !== sev ? 'opacity-25' : ''}`}
        >
          <span className="sr-only">{sev}{active === sev ? ` — ${t('catalog.current')}` : ''}</span>
        </li>
      ))}
    </ul>
  )
}

ColorStrip.propTypes = {
  active: PropTypes.string,
  className: PropTypes.string,
}
