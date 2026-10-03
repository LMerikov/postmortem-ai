import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { BellRing, Search, Megaphone, Wrench, CheckCircle2, Info, AlertTriangle, XCircle, Flame } from 'lucide-react'

const TYPE_CONFIG = {
  alert:      { Icon: BellRing,      tone: 'text-p0 bg-p0/15 ring-p0/30' },
  critical:   { Icon: Flame,         tone: 'text-p0 bg-p0/15 ring-p0/30' },
  error:      { Icon: XCircle,       tone: 'text-p1 bg-p1/15 ring-p1/30' },
  warning:    { Icon: AlertTriangle, tone: 'text-p2 bg-p2/15 ring-p2/30' },
  escalation: { Icon: Megaphone,     tone: 'text-p1 bg-p1/15 ring-p1/30' },
  detection:  { Icon: Search,        tone: 'text-p3 bg-p3/15 ring-p3/30' },
  info:       { Icon: Info,          tone: 'text-p4 bg-p4/15 ring-p4/30' },
  action:     { Icon: Wrench,        tone: 'text-accent-strong bg-accent/15 ring-accent/30' },
  resolution: { Icon: CheckCircle2,  tone: 'text-success bg-success/15 ring-success/30' },
}

export function Timeline({ entries = [] }) {
  const { t } = useTranslation()
  return (
    <ol className="relative">
      {entries.map((entry, i) => {
        const type = String(entry.type || 'action').toLowerCase()
        const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.action
        const last = i === entries.length - 1
        return (
          <li key={`${entry.time}-${i}`} className="relative flex gap-4 pb-5 last:pb-0">
            {!last && <span className="absolute left-[13px] top-8 bottom-0 w-px bg-border" aria-hidden="true" />}
            <span className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ${cfg.tone}`}>
              <cfg.Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <time className="tabular font-mono text-xs text-muted">{entry.time}</time>
                <span className="text-xs font-medium text-muted">
                  {t(`pm.eventType.${type}`, { defaultValue: entry.type })}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-text">{entry.event}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

Timeline.propTypes = {
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      time: PropTypes.string,
      event: PropTypes.string,
      type: PropTypes.string,
    })
  ),
}
