import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { FileText, ListOrdered, GitBranch, Activity, Zap, ListChecks, BookOpen, Radar } from 'lucide-react'
import { SeverityBadge } from './SeverityBadge'
import { Timeline } from './Timeline'
import { ImpactCard } from './ImpactCard'
import { ActionItems } from './ActionItems'
import { ExportButtons } from './ExportButtons'

/**
 * Ordered section metadata. `has` decides whether a section renders for a
 * given postmortem, so the result page can build a matching table of contents.
 */
export const PM_SECTIONS = [
  { id: 'summary',      label: 'pm.summary',      Icon: FileText,    has: (pm) => Boolean(pm.summary) },
  { id: 'timeline',     label: 'pm.timeline',     Icon: ListOrdered, has: (pm) => pm.timeline?.length > 0 },
  { id: 'root-cause',   label: 'pm.rootCause',    Icon: GitBranch,   has: (pm) => Boolean(pm.root_cause) },
  { id: 'impact',       label: 'pm.impact',       Icon: Activity,    has: (pm) => Boolean(pm.impact) },
  { id: 'actions',      label: 'pm.actionsTaken', Icon: Zap,         has: (pm) => pm.actions_taken?.length > 0 },
  { id: 'action-items', label: 'pm.actionItems',  Icon: ListChecks,  has: (pm) => pm.action_items?.length > 0 },
  { id: 'lessons',      label: 'pm.lessons',      Icon: BookOpen,    has: (pm) => pm.lessons_learned?.length > 0 },
  { id: 'monitoring',   label: 'pm.monitoring',   Icon: Radar,       has: (pm) => pm.monitoring_recommendations?.length > 0 },
]

function Section({ id, title, Icon, idPrefix, children }) {
  return (
    <section id={`${idPrefix}${id}`} aria-labelledby={`${idPrefix}${id}-h`} className="scroll-mt-24 space-y-4">
      <h3 id={`${idPrefix}${id}-h`} className="flex items-center gap-2.5 text-base font-semibold text-text">
        <Icon className="h-4 w-4 text-accent-strong" aria-hidden="true" />
        {title}
      </h3>
      {children}
    </section>
  )
}

Section.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  Icon: PropTypes.elementType.isRequired,
  idPrefix: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}

function BulletList({ items, ordered = false }) {
  const Tag = ordered ? 'ol' : 'ul'
  return (
    <Tag className="space-y-2.5">
      {items.map((text, i) => (
        <li key={`${i}-${text}`} className="flex items-start gap-3 text-sm leading-relaxed text-muted">
          {ordered
            ? <span className="tabular w-5 shrink-0 font-mono text-xs leading-6 text-accent-strong">{i + 1}.</span>
            : <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-muted" aria-hidden="true" />}
          <span className="text-text/90">{text}</span>
        </li>
      ))}
    </Tag>
  )
}

BulletList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  ordered: PropTypes.bool,
}

export function PostmortemView({ postmortem = null, showExport = true, idPrefix = '' }) {
  const { t } = useTranslation()
  if (!postmortem) return null

  const content = {
    'summary': <p className="max-w-[70ch] leading-relaxed text-text/90">{postmortem.summary}</p>,
    'timeline': <Timeline entries={postmortem.timeline} />,
    'root-cause': (
      <div className="rounded-lg border border-border bg-input p-4">
        <p className="max-w-[70ch] whitespace-pre-line text-sm leading-relaxed text-text/90">{postmortem.root_cause}</p>
      </div>
    ),
    'impact': <ImpactCard impact={postmortem.impact} />,
    'actions': <BulletList items={postmortem.actions_taken || []} />,
    'action-items': <ActionItems items={postmortem.action_items} />,
    'lessons': <BulletList items={postmortem.lessons_learned || []} ordered />,
    'monitoring': <BulletList items={postmortem.monitoring_recommendations || []} />,
  }

  return (
    <article className="space-y-10">
      <header className="space-y-4 border-b border-border pb-6">
        <SeverityBadge severity={postmortem.severity} size="lg" />
        <h2 className="text-2xl font-semibold leading-tight tracking-tight text-text sm:text-[1.75rem]">
          {postmortem.title}
        </h2>
        {showExport && <ExportButtons postmortem={postmortem} />}
      </header>

      {PM_SECTIONS.filter(s => s.has(postmortem)).map(({ id, label, Icon }) => (
        <Section key={id} id={id} title={t(label)} Icon={Icon} idPrefix={idPrefix}>
          {content[id]}
        </Section>
      ))}
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
}
