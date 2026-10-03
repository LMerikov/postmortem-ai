import { useEffect, useState, Fragment } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { SeverityBadge } from './SeverityBadge'
import { SeverityGuide } from './SeverityGuide'
import { Timeline } from './Timeline'
import { ImpactCard } from './ImpactCard'
import { ActionItems } from './ActionItems'
import { ExportButtons } from './ExportButtons'
import { ReviewNote, ReviewClose } from './ReviewBar'
import { SignalPlot } from '../Catalog/SignalPlot'
import { ColorStrip } from '../Catalog/ColorStrip'
import { incidentCode, timelinePlot, elapsedLabel, clockSeconds, parseRootCause, evidenceLines } from '../../lib/incident'

/**
 * Ordered section metadata. `has` decides whether a section renders for a
 * given postmortem, so the result page can build a matching table of contents.
 */
export const PM_SECTIONS = [
  { id: 'summary',      label: 'pm.summary',      has: (pm) => Boolean(pm.summary) },
  { id: 'timeline',     label: 'pm.timeline',     has: (pm) => pm.timeline?.length > 0 },
  { id: 'root-cause',   label: 'pm.rootCause',    has: (pm) => Boolean(pm.root_cause) },
  { id: 'impact',       label: 'pm.impact',       has: (pm) => Boolean(pm.impact) },
  { id: 'actions',      label: 'pm.actionsTaken', has: (pm) => pm.actions_taken?.length > 0 },
  { id: 'action-items', label: 'pm.actionItems',  has: (pm) => pm.action_items?.length > 0 },
  { id: 'lessons',      label: 'pm.lessons',      has: (pm) => pm.lessons_learned?.length > 0 },
  { id: 'monitoring',   label: 'pm.monitoring',   has: (pm) => pm.monitoring_recommendations?.length > 0 },
]

// Reference sections: closed by default; the decision sections stay open.
const COLLAPSED = new Set(['actions', 'lessons', 'monitoring'])

function CollapsibleSection({ id, title, idPrefix, count, open, onToggle, children }) {
  return (
    <section id={`${idPrefix}${id}`} aria-labelledby={`${idPrefix}${id}-h`} className="scroll-mt-24 border-t border-line/50">
      <details open={open} onToggle={(e) => onToggle(e.currentTarget.open)}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 hover:bg-subtle [&::-webkit-details-marker]:hidden">
          <h2 id={`${idPrefix}${id}-h`} className="caps-lg flex items-baseline gap-3 text-text">
            {title}
            <span className="tabular font-mono text-xs tracking-normal text-muted" aria-hidden="true">{String(count).padStart(2, '0')}</span>
          </h2>
          <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-line/70 font-mono text-sm leading-none text-text" aria-hidden="true">
            {open ? '\u2212' : '+'}
          </span>
        </summary>
        <div className="space-y-5 pb-5">{children}</div>
      </details>
    </section>
  )
}

CollapsibleSection.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  idPrefix: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  open: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
}

function Section({ id, title, idPrefix, children }) {
  return (
    <section id={`${idPrefix}${id}`} aria-labelledby={`${idPrefix}${id}-h`} className="scroll-mt-24 space-y-5 border-t border-line/50 pt-5">
      <h2 id={`${idPrefix}${id}-h`} className="caps-lg text-text">{title}</h2>
      {children}
    </section>
  )
}

Section.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  idPrefix: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}

function BulletList({ items, ordered = false }) {
  const Tag = ordered ? 'ol' : 'ul'
  return (
    <Tag className="border-t border-border">
      {items.map((text, i) => (
        <li key={`${i}-${text}`} className="flex items-start gap-4 border-b border-border py-3 text-[15px] leading-relaxed text-text">
          {ordered
            ? <span className="tabular w-6 shrink-0 font-mono text-xs leading-6 text-muted">{String(i + 1).padStart(2, '0')}</span>
            : <span className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-text" aria-hidden="true" />}
          <span className="max-w-[56ch]">{text}</span>
        </li>
      ))}
    </Tag>
  )
}

BulletList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  ordered: PropTypes.bool,
}

function RootCause({ text }) {
  const { t } = useTranslation()
  const parts = parseRootCause(text)
  if (!parts) {
    return <p className="max-w-[56ch] whitespace-pre-line text-[17px] leading-[1.65] text-text">{text}</p>
  }
  const conclusion = parts.find(p => p.key === 'conclusion')
  const rest = parts.filter(p => p.key !== 'conclusion')
  return (
    <div className="border-t border-border">
      {conclusion && (
        <div className="space-y-2 border-b border-border py-5">
          <p className="caps text-muted">{t('pm.rc.conclusion')}</p>
          <p className="max-w-[56ch] text-[17px] leading-[1.65] text-text">{conclusion.body}</p>
        </div>
      )}
      <dl>
        {rest.map(({ key, body }) => {
          const lines = key === 'evidence' ? evidenceLines(body) : []
          return (
            <div key={key} className="grid gap-x-8 gap-y-2 border-b border-border py-4 md:grid-cols-[9rem_minmax(0,1fr)]">
              <dt className="caps flex items-center gap-2 text-muted">
                {key === 'trigger' && <span className="h-2.5 w-2.5 shrink-0 bg-fac-red" aria-hidden="true" />}
                <span className={key === 'trigger' ? 'text-text' : ''}>{t(`pm.rc.${key}`)}</span>
              </dt>
              <dd className="min-w-0 text-[15px] leading-[1.65] text-text/90">
                {lines.length > 0 ? (
                  <ul className="space-y-1.5">
                    {lines.map((line, i) => (
                      <li key={`${i}-${line}`} className="break-words font-mono text-[13px] leading-relaxed">{line}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="block max-w-[56ch]">{body}</span>
                )}
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}

RootCause.propTypes = { text: PropTypes.string.isRequired }

export function PostmortemView({ postmortem = null, showExport = true, idPrefix = '', id = '' }) {
  const { t } = useTranslation()
  const [openIds, setOpenIds] = useState(() => new Set())
  const hasPm = Boolean(postmortem)

  // A TOC link or #hash pointing at a collapsed section opens it.
  useEffect(() => {
    if (!hasPm) return undefined
    const reveal = (hash, scroll) => {
      const sid = decodeURIComponent(hash.replace(/^#/, '')).slice(idPrefix.length)
      if (!COLLAPSED.has(sid) || !hash.replace(/^#/, '').startsWith(idPrefix)) return
      setOpenIds(prev => (prev.has(sid) ? prev : new Set(prev).add(sid)))
      if (scroll) requestAnimationFrame(() => document.getElementById(`${idPrefix}${sid}`)?.scrollIntoView())
    }
    const onClick = (e) => {
      const a = e.target.closest?.('a[href^="#"]')
      if (a) reveal(a.getAttribute('href'), false)
    }
    const onHash = () => reveal(window.location.hash, false)
    if (window.location.hash) reveal(window.location.hash, true)
    document.addEventListener('click', onClick)
    window.addEventListener('hashchange', onHash)
    return () => {
      document.removeEventListener('click', onClick)
      window.removeEventListener('hashchange', onHash)
    }
  }, [hasPm, idPrefix])

  if (!postmortem) return null

  const setOpen = (sid, isOpen) => setOpenIds(prev => {
    if (prev.has(sid) === isOpen) return prev
    const next = new Set(prev)
    if (isOpen) next.add(sid); else next.delete(sid)
    return next
  })

  const rcParts = parseRootCause(postmortem.root_cause || '')
  const headline = rcParts?.find(p => p.key === 'conclusion') ?? rcParts?.find(p => p.key === 'trigger')
  const sev = ['P0', 'P1', 'P2', 'P3', 'P4'].includes(postmortem.severity) ? postmortem.severity : 'P3'
  const bandColour = { P0: 'bg-fac-red', P1: 'bg-fac-yellow' }[sev]

  const visibleSections = PM_SECTIONS.filter(s => s.has(postmortem))
  const plot = timelinePlot(postmortem.timeline || [])
  const lastSecs = (postmortem.timeline || []).map(e => clockSeconds(e.time)).filter(s => s != null).pop()
  const span = elapsedLabel(lastSecs ?? null, plot.first)

  const content = {
    'summary': <p className="max-w-[56ch] text-[17px] leading-[1.65] text-text">{postmortem.summary}</p>,
    'timeline': <Timeline entries={postmortem.timeline} />,
    'root-cause': <RootCause text={postmortem.root_cause || ''} />,
    'impact': <ImpactCard impact={postmortem.impact} />,
    'actions': <BulletList items={postmortem.actions_taken || []} />,
    'action-items': <ActionItems items={postmortem.action_items} incidentId={id} />,
    'lessons': <BulletList items={postmortem.lessons_learned || []} ordered />,
    'monitoring': <BulletList items={(postmortem.monitoring_recommendations || []).map(r => String(r).replace(/^(metric|métrica)\s*:\s*/i, ''))} />,
  }

  return (
    <article className="min-w-0 space-y-12">
      <header className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
        <div className="flex min-w-0 gap-5">
          {bandColour && <span className={`w-3 shrink-0 self-stretch ${bandColour}`} aria-hidden="true" />}
          <div className="min-w-0 flex-1 space-y-6">
            <div className="space-y-3">
              <p className="display-wide whitespace-nowrap text-[clamp(2rem,4vw,3.5rem)] text-text" aria-label={`${t('catalog.incident')} ${incidentCode(id)}`}>
                <span aria-hidden="true">INC {incidentCode(id)}</span>
              </p>
              <ColorStrip active={postmortem.severity} />
            </div>
            <div className="space-y-3">
              <SeverityBadge severity={postmortem.severity} size="xl" />
              <SeverityGuide current={postmortem.severity} />
            </div>
            <div className="space-y-3">
              <h1 className="max-w-[26ch] font-display text-[clamp(1.5rem,3vw,2.1rem)] font-medium leading-[1.12] tracking-[-0.01em] text-text" style={{ fontStretch: '108%' }}>
                {postmortem.title}
              </h1>
              {headline && (
                <div className="max-w-[56ch] space-y-1.5 text-[15px] leading-relaxed text-muted">
                  <p className="caps text-text">{headline.key === 'conclusion' ? t('pm.rootCause') : t('pm.rc.trigger')}</p>
                  <p className="line-clamp-3">{headline.body}</p>
                  <a href={`#${idPrefix}root-cause`} className="inline-block text-text underline underline-offset-4 hover:no-underline">{t('result.seeRootCause')}</a>
                </div>
              )}
            </div>
            {showExport && <ExportButtons postmortem={postmortem} severity={sev} />}
          </div>
        </div>
        <figure className="hidden min-w-0 space-y-2 lg:block">
          <SignalPlot
            values={plot.values}
            marks={plot.marks}
            label={t('catalog.plotLabel', { count: postmortem.timeline?.length || 0 })}
            className="w-full"
          />
          <figcaption className="caps flex justify-between text-muted">
            <span>{t('catalog.events', { count: postmortem.timeline?.length || 0 })}</span>
            {span && <span className="tabular font-mono tracking-normal">{span}</span>}
          </figcaption>
          <p className="text-[13px] leading-relaxed text-muted">{t('catalog.howToReadResult')}</p>
        </figure>
      </header>

      <ReviewNote incidentId={id} />

      <label className="flex items-center gap-3 border-y border-border py-3 lg:hidden">
        <span className="caps shrink-0 text-muted">{t('result.jumpTo')}</span>
        <select
          className="input-base min-w-0 flex-1 py-2 text-sm"
          value=""
          onChange={(e) => {
            const sid = e.target.value
            if (!sid) return
            if (COLLAPSED.has(sid)) setOpen(sid, true)
            requestAnimationFrame(() => document.getElementById(`${idPrefix}${sid}`)?.scrollIntoView())
          }}
        >
          <option value="" disabled>{t('result.jumpPlaceholder')}</option>
          {visibleSections.map(({ id: sid, label }) => (
            <option key={sid} value={sid}>{t(label)}</option>
          ))}
        </select>
      </label>

      {visibleSections.map(({ id: sid, label }) => (
        <Fragment key={sid}>
          {COLLAPSED.has(sid) ? (
            <CollapsibleSection
              id={sid}
              title={t(label)}
              idPrefix={idPrefix}
              count={(content[sid].props.items || []).length}
              open={openIds.has(sid)}
              onToggle={(o) => setOpen(sid, o)}
            >
              {content[sid]}
            </CollapsibleSection>
          ) : (
            <Section id={sid} title={t(label)} idPrefix={idPrefix}>
              {content[sid]}
            </Section>
          )}
          {/* On phones the trace follows the summary instead of delaying it. */}
          {sid === 'summary' && (
            <figure className="mx-auto w-full min-w-0 max-w-[240px] space-y-2 sm:max-w-[300px] lg:hidden">
              <SignalPlot
                labelSize={19}
                values={plot.values}
                marks={plot.marks}
                label={t('catalog.plotLabel', { count: postmortem.timeline?.length || 0 })}
                className="w-full"
              />
              <figcaption className="caps flex justify-between text-muted">
                <span>{t('catalog.events', { count: postmortem.timeline?.length || 0 })}</span>
                {span && <span className="tabular font-mono tracking-normal">{span}</span>}
              </figcaption>
              <p className="text-[13px] leading-relaxed text-muted">{t('catalog.howToReadResult')}</p>
            </figure>
          )}
        </Fragment>
      ))}

      <div className="space-y-6 border-t border-line/50 pt-6">
        <ReviewClose incidentId={id} />
        {showExport && <ExportButtons postmortem={postmortem} severity={sev} alwaysOpen />}
      </div>
    </article>
  )
}

PostmortemView.propTypes = {
  postmortem: PropTypes.shape({
    title: PropTypes.string,
    severity: PropTypes.string,
    summary: PropTypes.string,
    timeline: PropTypes.array,
    root_cause: PropTypes.string,
    impact: PropTypes.object,
    actions_taken: PropTypes.arrayOf(PropTypes.string),
    action_items: PropTypes.array,
    lessons_learned: PropTypes.arrayOf(PropTypes.string),
    monitoring_recommendations: PropTypes.arrayOf(PropTypes.string),
  }),
  showExport: PropTypes.bool,
  idPrefix: PropTypes.string,
  id: PropTypes.string,
}
