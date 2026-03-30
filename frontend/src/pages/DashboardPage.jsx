import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { BarChart2, ShieldAlert, Zap, FlaskConical, TrendingUp, AlertTriangle } from 'lucide-react'
import { getDashboard } from '../services/api'

const SEVERITY_CONFIG = {
  P0: { label: 'P0 Critical', color: 'bg-p0',    text: 'text-p0',    border: 'border-p0/30' },
  P1: { label: 'P1 High',     color: 'bg-p1',    text: 'text-p1',    border: 'border-p1/30' },
  P2: { label: 'P2 Medium',   color: 'bg-p2',    text: 'text-p2',    border: 'border-p2/30' },
  P3: { label: 'P3 Low',      color: 'bg-p3',    text: 'text-p3',    border: 'border-p3/30' },
  P4: { label: 'P4 Info',     color: 'bg-p4',    text: 'text-p4',    border: 'border-p4/30' },
}

const ERROR_TYPE_COLORS = {
  Database:       'text-blue-400',
  Performance:    'text-yellow-400',
  Security:       'text-red-400',
  Network:        'text-cyan-400',
  Code:           'text-purple-400',
  Infrastructure: 'text-orange-400',
  Auth:           'text-pink-400',
  Unknown:        'text-muted',
}

function StatCard({ icon, label, value, sub, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card space-y-1 hover:border-accent/40 transition-colors"
    >
      <div className="flex items-center gap-2 text-muted text-sm">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-3xl font-bold text-text font-mono">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </motion.div>
  )
}

StatCard.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  sub: PropTypes.string,
  delay: PropTypes.number,
}

function SeverityBar({ severity, count, total }) {
  const cfg = SEVERITY_CONFIG[severity]
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-mono font-bold ${cfg.text}`}>{cfg.label}</span>
        <span className="text-muted">{count} ({pct}%)</span>
      </div>
      <div className="h-2 bg-card rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${cfg.color} opacity-80`}
        />
      </div>
    </div>
  )
}

SeverityBar.propTypes = {
  severity: PropTypes.oneOf(['P0', 'P1', 'P2', 'P3', 'P4']).isRequired,
  count: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
}

export function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard().then(data => {
      setStats(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-muted">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p>Cargando estadísticas...</p>
      </div>
    )
  }

  if (!stats || stats.total_postmortems === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-muted space-y-4">
        <BarChart2 className="w-12 h-12 mx-auto opacity-30" />
        <p className="text-lg font-medium">Aún no hay datos</p>
        <p className="text-sm">Analiza tus primeros logs para ver estadísticas aquí</p>
        <Link to="/" className="btn-primary inline-flex mt-4">
          <Zap className="w-4 h-4" />
          Analizar logs
        </Link>
      </div>
    )
  }

  const totalSev = Object.values(stats.severity_distribution).reduce((a, b) => a + b, 0)
  const criticalCount = (stats.severity_distribution.P0 || 0) + (stats.severity_distribution.P1 || 0)
  const topErrorType = Object.entries(stats.error_types)[0]
  const analyzeCount = stats.source_distribution?.analyze || 0
  const simulateCount = stats.source_distribution?.simulate || 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <p className="text-muted text-sm">Estadísticas de todos los postmortems analizados</p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<BarChart2 className="w-4 h-4 text-accent" />}
          label="Total analizados"
          value={stats.total_postmortems}
          sub="postmortems generados"
          delay={0}
        />
        <StatCard
          icon={<AlertTriangle className="w-4 h-4 text-p1" />}
          label="Críticos (P0+P1)"
          value={criticalCount}
          sub={`${totalSev > 0 ? Math.round((criticalCount / totalSev) * 100) : 0}% del total`}
          delay={0.05}
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4 text-success" />}
          label="Confianza promedio"
          value={`${stats.avg_confidence}%`}
          sub="precisión del análisis"
          delay={0.1}
        />
        <StatCard
          icon={<FlaskConical className="w-4 h-4 text-cyan" />}
          label="Simulaciones"
          value={simulateCount}
          sub={`${analyzeCount} reales`}
          delay={0.15}
        />
      </div>

      {/* Severity + Error types */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Severity distribution */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card space-y-4"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-accent" />
            <h2 className="font-semibold text-sm">Distribución por Severidad</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(SEVERITY_CONFIG).map(([sev]) => (
              <SeverityBar
                key={sev}
                severity={sev}
                count={stats.severity_distribution[sev] || 0}
                total={totalSev}
              />
            ))}
          </div>
        </motion.div>

        {/* Error types */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card space-y-4"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <h2 className="font-semibold text-sm">Tipos de Error Más Frecuentes</h2>
          </div>
          {Object.keys(stats.error_types).length === 0 ? (
            <p className="text-muted text-sm">Sin datos suficientes</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.error_types).slice(0, 7).map(([type, count], i) => {
                const pct = Math.round((count / stats.total_postmortems) * 100)
                const colorClass = ERROR_TYPE_COLORS[type] || 'text-muted'
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className={`text-xs font-mono font-bold w-24 truncate ${colorClass}`}>{type}</span>
                    <div className="flex-1 h-2 bg-card rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05 }}
                        className="h-full rounded-full bg-accent opacity-70"
                      />
                    </div>
                    <span className="text-xs text-muted w-8 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
          {topErrorType && (
            <p className="text-xs text-muted border-t border-border pt-3">
              Tipo más frecuente: <span className="text-text font-medium">{topErrorType[0]}</span> ({topErrorType[1]} incidentes)
            </p>
          )}
        </motion.div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex gap-3 justify-center pt-4"
      >
        <Link to="/" className="btn-primary">
          <Zap className="w-4 h-4" />
          Analizar nuevos logs
        </Link>
        <Link to="/history" className="btn-secondary">
          Ver historial completo
        </Link>
      </motion.div>

    </div>
  )
}
