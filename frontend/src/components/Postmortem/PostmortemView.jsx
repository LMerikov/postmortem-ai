import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { SeverityBadge } from './SeverityBadge'
import { Timeline } from './Timeline'
import { ImpactCard } from './ImpactCard'
import { ActionItems } from './ActionItems'
import { ExportButtons } from './ExportButtons'

const Section = ({ title, icon, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease: 'easeOut' }}
    className="space-y-3"
  >
    <h3 className="text-base font-semibold flex items-center gap-2 text-text border-b border-border/50 pb-2">
      <span>{icon}</span> {title}
    </h3>
    {children}
  </motion.div>
)

Section.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  delay: PropTypes.number,
}

Section.defaultProps = {
  delay: 0,
}

const SEVERITY_GLOW = {
  P0: 'shadow-[0_0_24px_rgba(214,48,49,0.15)] border-p0/30',
  P1: 'shadow-[0_0_24px_rgba(225,112,85,0.15)] border-p1/30',
  P2: 'shadow-[0_0_24px_rgba(253,203,110,0.10)] border-p2/30',
  P3: 'shadow-[0_0_24px_rgba(9,132,227,0.15)] border-p3/30',
  P4: 'shadow-none border-border',
}

export function PostmortemView({ postmortem, showExport = true }) {
  if (!postmortem) return null

  const glowClass = SEVERITY_GLOW[postmortem.severity] || SEVERITY_GLOW.P4

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`space-y-8 card ${glowClass}`}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between flex-wrap gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <SeverityBadge severity={postmortem.severity} size="lg" />
          </div>
          <h2 className="text-2xl font-bold text-text leading-tight">{postmortem.title}</h2>
        </div>
        {showExport && <ExportButtons postmortem={postmortem} />}
      </motion.div>

      {/* Summary */}
      <Section title="Resumen Ejecutivo" icon="📋" delay={0.1}>
        <p className="text-muted leading-relaxed">{postmortem.summary}</p>
      </Section>

      {/* Timeline */}
      {postmortem.timeline?.length > 0 && (
        <Section title="Timeline" icon="📅" delay={0.2}>
          <Timeline entries={postmortem.timeline} />
        </Section>
      )}

      {/* Root Cause */}
      <Section title="Análisis de Causa Raíz" icon="🔍" delay={0.3}>
        <div className="bg-input border border-border rounded-lg p-4">
          <p className="text-text leading-relaxed whitespace-pre-line">{postmortem.root_cause}</p>
        </div>
      </Section>

      {/* Impact */}
      <Section title="Impacto" icon="💥" delay={0.4}>
        <ImpactCard impact={postmortem.impact} />
      </Section>

      {/* Actions Taken */}
      {postmortem.actions_taken?.length > 0 && (
        <Section title="Acciones Tomadas Durante el Incidente" icon="⚡" delay={0.45}>
          <ul className="space-y-2">
            {postmortem.actions_taken.map((a, i) => (
              <motion.li
                key={a}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.05 }}
                className="text-muted text-sm flex items-start gap-2"
              >
                <span className="text-accent mt-0.5 flex-shrink-0">›</span> {a}
              </motion.li>
            ))}
          </ul>
        </Section>
      )}

      {/* Action Items */}
      {postmortem.action_items?.length > 0 && (
        <Section title="Tareas de Seguimiento" icon="✅" delay={0.5}>
          <ActionItems items={postmortem.action_items} />
        </Section>
      )}

      {/* Lessons Learned */}
      {postmortem.lessons_learned?.length > 0 && (
        <Section title="Lecciones Aprendidas" icon="📖" delay={0.55}>
          <ol className="space-y-2">
            {postmortem.lessons_learned.map((l, i) => (
              <motion.li
                key={l}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + i * 0.05 }}
                className="text-muted text-sm flex items-start gap-3"
              >
                <span className="text-accent font-mono font-bold flex-shrink-0">{i + 1}.</span>
                {l}
              </motion.li>
            ))}
          </ol>
        </Section>
      )}

      {/* Monitoring */}
      {postmortem.monitoring_recommendations?.length > 0 && (
        <Section title="Recomendaciones de Monitoreo" icon="📊" delay={0.6}>
          <ul className="space-y-2">
            {postmortem.monitoring_recommendations.map((r, i) => (
              <motion.li
                key={r}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.05 }}
                className="text-muted text-sm flex items-start gap-2"
              >
                <span className="text-cyan mt-0.5 flex-shrink-0">›</span> {r}
              </motion.li>
            ))}
          </ul>
        </Section>
      )}
    </motion.div>
  )
}

PostmortemView.propTypes = {
  postmortem: PropTypes.shape({
    title: PropTypes.string,
    severity: PropTypes.oneOf(['P0', 'P1', 'P2', 'P3', 'P4']),
    summary: PropTypes.string,
    timeline: PropTypes.arrayOf(
      PropTypes.shape({
        time: PropTypes.string,
        event: PropTypes.string,
        type: PropTypes.string,
      })
    ),
    root_cause: PropTypes.string,
    impact: PropTypes.shape({
      users_affected: PropTypes.string,
      duration: PropTypes.string,
      services_affected: PropTypes.arrayOf(PropTypes.string),
      revenue_impact: PropTypes.string,
    }),
    actions_taken: PropTypes.arrayOf(PropTypes.string),
    action_items: PropTypes.arrayOf(
      PropTypes.shape({
        description: PropTypes.string,
        owner: PropTypes.string,
        priority: PropTypes.string,
      })
    ),
    lessons_learned: PropTypes.arrayOf(PropTypes.string),
    monitoring_recommendations: PropTypes.arrayOf(PropTypes.string),
  }),
  showExport: PropTypes.bool,
}

PostmortemView.defaultProps = {
  postmortem: null,
  showExport: true,
}
