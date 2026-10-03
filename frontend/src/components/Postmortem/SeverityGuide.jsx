import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

const ORDER = ['P0', 'P1', 'P2', 'P3', 'P4']
const BLOCK = { P0: 'bg-fac-red', P1: 'bg-fac-yellow', P2: 'bg-fac-blue', P3: 'bg-fac-white', P4: 'bg-fac-grey' }
const INK = { P0: 'text-white', P1: 'text-black', P2: 'text-white', P3: 'text-black', P4: 'text-black' }

/** Collapsed reference for what P0–P4 mean. A common convention, so it says so. */
export function SeverityGuide({ current }) {
  const { t } = useTranslation()
  return (
    <details className="group max-w-md">
      <summary className="caps inline-flex cursor-pointer list-none items-center gap-3 text-muted hover:text-text">
        <span className="flex h-4 w-4 items-center justify-center border border-line/70 font-mono text-xs leading-none group-open:hidden" aria-hidden="true">+</span>
        <span className="hidden h-4 w-4 items-center justify-center border border-line/70 font-mono text-xs leading-none group-open:flex" aria-hidden="true">−</span>
        {t('severityGuide.title')}
      </summary>
      <div className="mt-4 border-t border-border">
        <ul>
          {ORDER.map((sev) => (
            <li key={sev} className={`flex items-start gap-3 border-b border-border py-2.5 ${sev === current ? 'bg-subtle' : ''}`}>
              <span className={`mt-0.5 w-9 shrink-0 py-0.5 text-center font-mono text-xs font-semibold ${BLOCK[sev]} ${INK[sev]}`}>{sev}</span>
              <p className="text-[13px] leading-relaxed text-text">
                <span className="caps mr-2">{t(`severity.${sev}`)}</span>
                <span className="text-muted">{t(`severityGuide.${sev}`)}</span>
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">{t('severityGuide.note')}</p>
      </div>
    </details>
  )
}

SeverityGuide.propTypes = {
  current: PropTypes.string,
}
