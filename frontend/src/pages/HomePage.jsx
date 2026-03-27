import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, FlaskConical, ArrowRight, Shield, Clock, FileCheck } from 'lucide-react'
import { LogInput } from '../components/Analyze/LogInput'
import { analyzeLogs } from '../services/api'
import { useToast } from '../components/UI/Toast'
import { GeneratingState } from '../components/UI/LoadingSpinner'

const EXAMPLE_LOGS = `2026-03-18 14:23:01 [ERROR] PostgreSQL: FATAL: too many connections for role "webapp"
2026-03-18 14:23:02 [WARN]  Connection pool exhausted - 100/100 connections in use
2026-03-18 14:23:03 [ERROR] API /api/users: database connection timeout after 30s
2026-03-18 14:23:10 [ALERT] Health check failed for service: user-service
2026-03-18 14:23:30 [INFO]  PagerDuty alert triggered: DB_CONNECTION_POOL_EXHAUSTED
2026-03-18 14:25:00 [INFO]  On-call engineer acknowledged alert
2026-03-18 14:31:00 [INFO]  Identified leaked connections from background job worker
2026-03-18 14:42:00 [INFO]  All health checks passing`

const QUICK_SIMS = [
  { icon: '🗄️', label: 'Caída de BD',  type: 'database_outage' },
  { icon: '🛡️', label: 'Ataque DDoS', type: 'ddos_attack' },
  { icon: '💾', label: 'Fuga Memoria', type: 'memory_leak' },
  { icon: '🔒', label: 'SSL Expirado', type: 'certificate_expiration' },
  { icon: '🚀', label: 'Mal Deploy',   type: 'bad_deployment' },
]

const FEATURES = [
  { icon: <Zap className="w-5 h-5 text-accent" />, title: 'Análisis Instantáneo', desc: 'La IA analiza logs y genera postmortems en segundos' },
  { icon: <Shield className="w-5 h-5 text-cyan" />, title: 'Modo Entrenamiento', desc: 'Genera incidentes realistas para entrenar a tu equipo' },
  { icon: <Clock className="w-5 h-5 text-p2" />, title: 'Ahorra Horas', desc: 'Automatiza el tedioso proceso de escribir postmortems' },
  { icon: <FileCheck className="w-5 h-5 text-success" />, title: 'Listo para Exportar', desc: 'Descarga en PDF o Markdown con un clic' },
]

export function HomePage() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  const handleAnalyze = async () => {
    if (!content.trim()) {
      toast('Por favor pega logs o describe el incidente', 'error')
      return
    }
    setLoading(true)
    try {
      const result = await analyzeLogs(content)
      navigate(`/result/${result.id}`)
    } catch (e) {
      toast(e.message, 'error')
      setLoading(false)
    }
  }

  const handleQuickSim = (type) => {
    navigate('/simulate', { state: { incident_type: type } })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 text-xs text-accent border border-accent/30 bg-accent/10 px-3 py-1.5 rounded-full font-mono mb-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse-slow" />
          <span>Análisis de Incidentes con IA</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
          De logs caóticos a<br />
          <span className="text-gradient">postmortems profesionales</span><br />
          en segundos
        </h1>
        <p className="text-muted text-lg max-w-xl mx-auto">
          Pega tus logs de servidor, stacktraces o describe el incidente. Nuestra IA genera un postmortem
          completo y estructurado siguiendo las mejores prácticas del SRE de Google.
        </p>
      </motion.div>

      {/* Main input */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {loading ? (
          <div className="card">
            <GeneratingState text="Groq está analizando tu incidente... (~3s)" />
          </div>
        ) : (
          <>
            <LogInput value={content} onChange={setContent} disabled={loading} />
            <div className="flex items-center gap-3">
              <button onClick={handleAnalyze} disabled={loading || !content.trim()} className="btn-primary">
                <Zap className="w-5 h-5" />
                Generar Postmortem
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setContent(EXAMPLE_LOGS)}
                className="text-sm text-muted hover:text-accent transition-colors"
              >
                Probar un ejemplo
              </button>
            </div>
          </>
        )}
      </motion.div>

      {/* Divider */}
      <div className="relative text-center">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <span className="relative bg-bg px-4 text-muted text-sm">— o prueba el Modo Simulación —</span>
      </div>

      {/* Quick simulations */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-cyan" />
          <h2 className="text-base font-semibold text-text">Simulaciones Rápidas</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {QUICK_SIMS.map(({ icon, label, type }) => (
            <button
              key={type}
              onClick={() => handleQuickSim(type)}
              className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl hover:border-cyan/50 hover:bg-cyan/5 transition-all duration-200 group"
            >
              <span className="text-xl">{icon}</span>
              <span className="text-sm text-muted group-hover:text-text transition-colors">{label}</span>
            </button>
          ))}
          <button
            onClick={() => navigate('/simulate')}
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl hover:border-accent/50 text-muted hover:text-text transition-all duration-200"
          >
            <span className="text-sm">Más...</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Features grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURES.map(({ icon, title, desc }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            whileHover={{ scale: 1.03, y: -2 }}
            className="card text-center space-y-2 hover:border-accent/40 hover:shadow-[0_0_20px_rgba(108,92,231,0.15)] transition-all duration-300 cursor-default"
          >
            <div className="flex justify-center">{icon}</div>
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-muted">{desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
