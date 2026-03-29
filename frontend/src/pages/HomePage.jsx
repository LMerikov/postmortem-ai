import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, FlaskConical, ArrowRight, Shield, Clock, FileCheck } from 'lucide-react'
import { LogInput } from '../components/Analyze/LogInput'
import { analyzeLogs, getStats } from '../services/api'
import { useToast } from '../components/UI/Toast'
import { GeneratingState } from '../components/UI/LoadingSpinner'

const EXAMPLE_LOGS = `2026-03-29 03:10:11 [INFO] [api-gateway] POST /api/checkout/confirm - user_id: 8821
2026-03-29 03:10:12 [INFO] [inventory-service] Verificando stock para order #ORD-4471
2026-03-29 03:10:13 [WARNING] [inventory-service] Lock en tabla 'stock' tardando más de 1000ms
2026-03-29 03:10:14 [INFO] [inventory-service] Stock confirmado. Llamando a payment-service
2026-03-29 03:10:14 [INFO] [payment-service] Procesando pago con stripe.com (timeout: 5s)
2026-03-29 03:10:18 [WARNING] [payment-service] stripe.com sin respuesta tras 4000ms
2026-03-29 03:10:20 [ERROR] [payment-service] Timeout: stripe.com no respondió en 5800ms
2026-03-29 03:10:20 [ERROR] [payment-service] Reintentando llamada a stripe (intento 1/3)
2026-03-29 03:10:21 [ERROR] [payment-service] Reintentando llamada a stripe (intento 2/3)
2026-03-29 03:10:22 [ERROR] [payment-service] Fallo definitivo. Todos los reintentos agotados.
2026-03-29 03:10:22 [ERROR] [api-gateway] HTTP 503 Service Unavailable - user_id: 8821`

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
  const [totalPostmortems, setTotalPostmortems] = useState(null)
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    getStats().then(data => setTotalPostmortems(data.total_postmortems))
  }, [])

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
        <div className="flex items-center justify-center gap-3 flex-wrap mb-2">
          <div className="inline-flex items-center gap-2 text-xs text-accent border border-accent/30 bg-accent/10 px-3 py-1.5 rounded-full font-mono">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse-slow" />
            <span>Análisis de Incidentes con IA</span>
          </div>
          {totalPostmortems > 0 && (
            <div className="inline-flex items-center gap-1.5 text-xs text-success border border-success/30 bg-success/10 px-3 py-1.5 rounded-full font-mono">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span>{totalPostmortems} postmortems generados</span>
            </div>
          )}
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
