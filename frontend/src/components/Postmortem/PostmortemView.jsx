import { motion } from 'framer-motion'
import { SeverityBadge } from './SeverityBadge'
import { Timeline } from './Timeline'
import { ImpactCard } from './ImpactCard'
import { ActionItems } from './ActionItems'
import { ExportButtons } from './ExportButtons'

const Section = ({ title, icon, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-3"
  >
    <h3 className="text-base font-semibold flex items-center gap-2 text-text">
      <span>{icon}</span> {title}
    </h3>
    {children}
  </motion.div>
)

export function PostmortemView({ postmortem, showExport = true }) {
  if (!postmortem) return null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <SeverityBadge severity={postmortem.severity} size="lg" />
          </div>
          <h2 className="text-2xl font-bold text-text">{postmortem.title}</h2>
        </div>
        {showExport && <ExportButtons postmortem={postmortem} />}
      </div>

      {/* Summary */}
      <Section title="Resumen Ejecutivo" icon="📋">
        <p className="text-muted leading-relaxed">{postmortem.summary}</p>
      </Section>

      {/* Timeline */}
      {postmortem.timeline?.length > 0 && (
        <Section title="Timeline" icon="📅">
          <Timeline entries={postmortem.timeline} />
        </Section>
      )}

      {/* Root Cause */}
      <Section title="Análisis de Causa Raíz" icon="🔍">
        <div className="bg-input border border-border rounded-lg p-4">
          <p className="text-text leading-relaxed whitespace-pre-line">{postmortem.root_cause}</p>
        </div>
      </Section>

      {/* Impact */}
      <Section title="Impacto" icon="💥">
        <ImpactCard impact={postmortem.impact} />
      </Section>

      {/* Actions Taken */}
      {postmortem.actions_taken?.length > 0 && (
        <Section title="Acciones Tomadas Durante el Incidente" icon="⚡">
          <ul className="space-y-1">
            {postmortem.actions_taken.map((a, i) => (
              <li key={i} className="text-muted text-sm flex items-start gap-2">
                <span className="text-accent mt-0.5">›</span> {a}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Action Items */}
      {postmortem.action_items?.length > 0 && (
        <Section title="Tareas de Seguimiento" icon="✅">
          <ActionItems items={postmortem.action_items} />
        </Section>
      )}

      {/* Lessons Learned */}
      {postmortem.lessons_learned?.length > 0 && (
        <Section title="Lecciones Aprendidas" icon="📖">
          <ol className="space-y-2">
            {postmortem.lessons_learned.map((l, i) => (
              <li key={i} className="text-muted text-sm flex items-start gap-3">
                <span className="text-accent font-mono font-bold flex-shrink-0">{i + 1}.</span>
                {l}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Monitoring */}
      {postmortem.monitoring_recommendations?.length > 0 && (
        <Section title="Recomendaciones de Monitoreo" icon="📊">
          <ul className="space-y-1">
            {postmortem.monitoring_recommendations.map((r, i) => (
              <li key={i} className="text-muted text-sm flex items-start gap-2">
                <span className="text-cyan mt-0.5">›</span> {r}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}
