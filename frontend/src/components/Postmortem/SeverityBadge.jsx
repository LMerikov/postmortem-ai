import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

// Colour is the code, the words are the meaning: never colour alone.
const BLOCK = { P0: 'bg-fac-red', P1: 'bg-fac-yellow', P2: 'bg-fac-blue', P3: 'bg-fac-white', P4: 'bg-fac-grey' }

export function SeverityBadge({ severity = 'P3', size = 'md' }) {
  const { t } = useTranslation()
  const sev = BLOCK[severity] ? severity : 'P3'
  const big = size === 'lg'
  if (size === 'xl') {
    // Header block: the loudest, most meaningful element. Code and word travel together.
    // The code is mono with a slashed zero: in wide Archivo "P0" reads as "PO".
    return (
      <span className="inline-flex items-stretch border border-line/70 whitespace-nowrap">
        <span className={`flex items-center px-5 py-3 font-mono text-[clamp(2.25rem,4.2vw,3.5rem)] font-semibold leading-none tracking-[-0.04em] [font-feature-settings:'zero'] ${BLOCK[sev]} ${sev === 'P0' || sev === 'P2' ? 'text-white' : 'text-black'}`}>
          {sev}
        </span>
        <span className="caps-lg flex items-center px-5 text-text">{t(`severity.${sev}`)}</span>
      </span>
    )
  }
  return (
    <span className={`inline-flex items-stretch border border-line/70 ${big ? 'caps-lg' : 'caps'} whitespace-nowrap`}>
      <span className={`flex items-center px-2.5 font-mono font-semibold tracking-normal ${BLOCK[sev]} ${sev === 'P0' || sev === 'P2' ? 'text-white' : 'text-black'} ${big ? 'py-1.5 text-sm' : 'py-1 text-xs'}`}>
        {sev}
      </span>
      <span className={`flex items-center ${big ? 'px-3.5' : 'px-2.5'}`}>{t(`severity.${sev}`)}</span>
    </span>
  )
}

SeverityBadge.propTypes = {
  severity: PropTypes.string,
  size: PropTypes.oneOf(['md', 'lg', 'xl']),
}
