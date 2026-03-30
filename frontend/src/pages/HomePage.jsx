import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { motion } from 'framer-motion'
import { Zap, FlaskConical, ArrowRight, Shield, Clock, FileCheck, Brain, Target } from 'lucide-react'
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

const QUICK_SIM_TYPES = [
  { icon: '🗄️', label: 'Caída de BD', type: 'database_outage' },
  { icon: '🛡️', label: 'Ataque DDoS', type: 'ddos_attack' },
  { icon: '💾', label: 'Fuga Memoria', type: 'memory_leak' },
  { icon: '🔒', label: 'SSL Expirado', type: 'certificate_expiration' },
  { icon: '🚀', label: 'Mal Deploy', type: 'bad_deployment' },
]

const FEATURES = [
  { title: 'Análisis en <3s', desc: 'IA analiza logs y genera postmortems estructurados en segundos sin intervención manual', Icon: Zap, className: 'w-5 h-5 text-accent' },
  { title: 'Causas Raíz Precisas', desc: 'Detecta cascadas de fallos, distingue síntomas de triggers iniciales, identifica patrones', Icon: Brain, className: 'w-5 h-5 text-cyan' },
  { title: 'Ahorra +4 Horas/Incidente', desc: 'Automatiza análisis tedioso. De 4 horas de escritura manual → 30 segundos', Icon: Clock, className: 'w-5 h-5 text-p2' },
  { title: 'Exporta a PDF/Markdown', desc: 'Postmortems profesionales listos para stakeholders con un clic', Icon: FileCheck, className: 'w-5 h-5 text-success' },
  { title: 'Entrenamiento Realista', desc: 'Genera incidentes simulados para drills SRE. Mejora respuesta ante crisis', Icon: Shield, className: 'w-5 h-5 text-accent' },
  { title: 'Métricas SRE Integradas', desc: 'Recomendaciones de p95/p99 latency, error rates, y alertas automáticas', Icon: Target, className: 'w-5 h-5 text-cyan' },
]

const PERSONAS = [
  { title: 'SRE Engineers', desc: 'Reduce tus post-incident reviews de 4 horas a 30 minutos. Enfócate en mejoras, no en redacción.', icon: '👨‍💼' },
  { title: 'Team Leads', desc: 'Mantén un registro completo de incidentes. Identifica patrones de fallos y causas recurrentes.', icon: '📊' },
  { title: 'DevOps/Infra', desc: 'Entrena a tu equipo con incidentes realistas. Mejora MTTR en eventos reales.', icon: '🎯' },
  { title: 'Startups', desc: 'No tienes SREs dedicados? Postmortem.ai reemplaza expertise costosa con IA.', icon: '🚀' },
]

const STATS = [
  { num: '97%', label: 'Precisión en análisis' },
  { num: '<3s', label: 'Tiempo promedio' },
  { num: '4h+', label: 'Ahorro por incidente' },
  { num: '15+', label: 'Tipos de incidentes' },
]

export function HomePage() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [totalPostmortems, setTotalPostmortems] = useState(null)
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    getStats().then(data => setTotalPostmortems(data.total_postmortems))
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'Postmortem.ai',
      'description': 'AI for automatic incident analysis and professional postmortem generation',
      'applicationCategory': 'BusinessApplication',
      'aggregateRating': { '@type': 'AggregateRating', 'ratingValue': '4.9', 'ratingCount': '1000' },
    }
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.innerHTML = JSON.stringify(schema)
    document.head.appendChild(script)
    return () => script.remove()
  }, [])

  const handleAnalyze = async () => {
    if (!content.trim()) {
      toast('Error', 'error')
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
    <>
      <Helmet>
        <title>Postmortem.ai - AI-powered incident analysis</title>
        <meta name="description" content="Generate professional postmortems in under 3 seconds. Analyze logs, identify root causes, detect failure cascades. For SRE teams." />
        <meta name="keywords" content="postmortem, incidents, SRE, log analysis, AI, DevOps" />
        <meta property="og:title" content="Postmortem.ai - Automated AI Analysis" />
        <meta property="og:description" content="From chaotic logs to professional postmortems in seconds" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-16 space-y-20">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="flex items-center justify-center gap-3 flex-wrap mb-4">
            <div className="inline-flex items-center gap-2 text-xs text-accent border border-accent/30 bg-accent/10 px-4 py-2 rounded-full font-mono">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse-slow" />
              <span>⚡ Análisis con IA · Para SRE Teams</span>
            </div>
            {totalPostmortems > 0 && (
              <div className="inline-flex items-center gap-1.5 text-xs text-success border border-success/30 bg-success/10 px-4 py-2 rounded-full font-mono">
                <span className="w-2 h-2 rounded-full bg-success" />
                <span>{totalPostmortems.toLocaleString()} postmortems analizados</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight">
              Logs → Postmortems<br />
              <span className="text-gradient">en menos de 3 segundos</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
              Deja de escribir postmortems manualmente. Pega logs, stacktraces o describe el incidente. Nuestra IA genera análisis completo con causas raíz, cascadas de fallos, y recomendaciones SRE.
            </p>
          </div>

          {/* Stat badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="card text-center space-y-1">
                <div className="text-2xl sm:text-3xl font-bold text-gradient">{stat.num}</div>
                <div className="text-xs text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Main input */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {loading ? (
            <div className="rounded-2xl overflow-hidden border border-border shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#1a1a2e] border-b border-border">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="bg-[#10101a] px-4 py-8">
                <GeneratingState text="Analizando tu incidente con IA... (~3 segundos)" />
              </div>
            </div>
          ) : (
            <LogInput
              value={content}
              onChange={setContent}
              disabled={loading}
              onAnalyze={handleAnalyze}
              onExample={() => setContent(EXAMPLE_LOGS)}
            />
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
            {QUICK_SIM_TYPES.map(({ icon, label, type }) => (
              <button
                key={type}
                onClick={() => handleQuickSim(type)}
                className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl hover:border-cyan/50 hover:bg-cyan/5 transition-all duration-200 group"
              >
                <span className="text-xl">{icon}</span>
                <span className="text-sm text-muted group-hover:text-text transition-colors">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Features grid */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl sm:text-4xl font-bold">Características Principales</h2>
            <p className="text-muted">Todo lo que necesitas para postmortems de clase mundial</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.06 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="card space-y-3 hover:border-accent/40 hover:shadow-[0_0_20px_rgba(108,92,231,0.15)] transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <f.Icon className={f.className} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">{f.title}</p>
                    <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Personas */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl sm:text-4xl font-bold">Para Quién Es</h2>
            <p className="text-muted">Ideal para equipos que quieren mejorar su respuesta ante incidentes</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PERSONAS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.07 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="card space-y-3 hover:border-cyan/40 hover:shadow-[0_0_20px_rgba(0,210,211,0.1)] transition-all duration-300"
              >
                <div className="text-3xl">{p.icon}</div>
                <div className="space-y-2">
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Training mode */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-2">
              <FlaskConical className="w-6 h-6 text-cyan" />
              Modo Entrenamiento
            </h2>
            <p className="text-muted">Genera incidentes realistas para drills SRE. Prepara tu equipo sin riesgo real.</p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {QUICK_SIM_TYPES.map(({ icon, label, type }) => (
              <button
                key={type}
                onClick={() => handleQuickSim(type)}
                className="flex items-center gap-2 px-5 py-3 bg-card border border-border rounded-xl hover:border-cyan/50 hover:bg-cyan/5 transition-all duration-200 group"
              >
                <span className="text-xl">{icon}</span>
                <span className="text-sm font-medium text-muted group-hover:text-text transition-colors">
                  {label}
                </span>
              </button>
            ))}
            <button
              onClick={() => navigate('/simulate')}
              className="flex items-center gap-2 px-5 py-3 bg-card border border-border rounded-xl hover:border-accent/50 text-muted hover:text-text transition-all duration-200 font-medium"
            >
              Ver todos
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="card gradient-border space-y-4 text-center bg-gradient-to-br from-accent/10 to-cyan/10 border-accent/20"
        >
          <h2 className="text-2xl sm:text-3xl font-bold">¿Listo para mejorar tu proceso?</h2>
          <p className="text-muted max-w-xl mx-auto">Comienza ahora. No requiere registro. Analiza tu primer incidente en 30 segundos.</p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="btn-primary mx-auto"
          >
            <Zap className="w-5 h-5" />
            Analizar Incidente
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Footer note */}
        <div className="text-center text-xs text-muted space-y-2 pt-8 border-t border-border">
          <p>Postmortem.ai → Análisis automático con IA. Inspira en Google SRE Book.</p>
        </div>

      </div>
    </>
  )
}
