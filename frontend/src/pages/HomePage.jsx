import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { motion } from 'framer-motion'
import { Zap, FlaskConical, ArrowRight, Shield, Clock, FileCheck, TrendingDown, Brain, Target } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  { icon: '🗄️', key: 'database', type: 'database_outage' },
  { icon: '🛡️', key: 'ddos',     type: 'ddos_attack' },
  { icon: '💾', key: 'memory',   type: 'memory_leak' },
  { icon: '🔒', key: 'ssl',      type: 'certificate_expiration' },
  { icon: '🚀', key: 'deploy',   type: 'bad_deployment' },
]

const FEATURE_ICONS = [
  <Zap      className="w-5 h-5 text-accent" />,
  <Brain    className="w-5 h-5 text-cyan" />,
  <Clock    className="w-5 h-5 text-p2" />,
  <FileCheck className="w-5 h-5 text-success" />,
  <Shield   className="w-5 h-5 text-accent" />,
  <Target   className="w-5 h-5 text-cyan" />,
]

const STATS_NUMS = ['97%', '<3s', '4h+', '15+']
const STATS_KEYS = ['precision', 'time', 'savings', 'types']

export function HomePage() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [totalPostmortems, setTotalPostmortems] = useState(null)
  const navigate = useNavigate()
  const toast = useToast()
  const { t } = useTranslation()

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
    return () => document.head.removeChild(script)
  }, [])

  const handleAnalyze = async () => {
    if (!content.trim()) {
      toast(t('common.error'), 'error')
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

  const features = t('home.features', { returnObjects: true })
  const personas = t('home.personas', { returnObjects: true })

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
              <span>⚡ {t('home.badge')}</span>
            </div>
            {totalPostmortems > 0 && (
              <div className="inline-flex items-center gap-1.5 text-xs text-success border border-success/30 bg-success/10 px-4 py-2 rounded-full font-mono">
                <span className="w-2 h-2 rounded-full bg-success" />
                <span>{totalPostmortems.toLocaleString()} {t('home.stats_analyzed')}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight">
              Logs → Postmortems<br />
              <span className="text-gradient">{t('home.headline_gradient')}</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
              {t('home.sub')}
            </p>
          </div>

          {/* Stat badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
            {STATS_NUMS.map((num, i) => (
              <div key={i} className="card text-center space-y-1">
                <div className="text-2xl sm:text-3xl font-bold text-gradient">{num}</div>
                <div className="text-xs text-muted">{t(`home.stats.${STATS_KEYS[i]}`)}</div>
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
                <GeneratingState text={t('home.analyzing')} />
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
          <span className="relative bg-bg px-4 text-muted text-sm">— {t('home.divider')} —</span>
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
            <h2 className="text-base font-semibold text-text">{t('home.quick_sims_title')}</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {QUICK_SIM_TYPES.map(({ icon, key, type }) => (
              <button
                key={type}
                onClick={() => handleQuickSim(type)}
                className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl hover:border-cyan/50 hover:bg-cyan/5 transition-all duration-200 group"
              >
                <span className="text-xl">{icon}</span>
                <span className="text-sm text-muted group-hover:text-text transition-colors">
                  {t(`home.quick_sims.${key}`)}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Features grid */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl sm:text-4xl font-bold">{t('home.features_title')}</h2>
            <p className="text-muted">{t('home.features_sub')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(features) && features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.06 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="card space-y-3 hover:border-accent/40 hover:shadow-[0_0_20px_rgba(108,92,231,0.15)] transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">{FEATURE_ICONS[i]}</div>
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
            <h2 className="text-3xl sm:text-4xl font-bold">{t('home.personas_title')}</h2>
            <p className="text-muted">{t('home.personas_sub')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.isArray(personas) && personas.map((p, i) => (
              <motion.div
                key={i}
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
              {t('home.training_title')}
            </h2>
            <p className="text-muted">{t('home.training_sub')}</p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {QUICK_SIM_TYPES.map(({ icon, key, type }) => (
              <button
                key={type}
                onClick={() => handleQuickSim(type)}
                className="flex items-center gap-2 px-5 py-3 bg-card border border-border rounded-xl hover:border-cyan/50 hover:bg-cyan/5 transition-all duration-200 group"
              >
                <span className="text-xl">{icon}</span>
                <span className="text-sm font-medium text-muted group-hover:text-text transition-colors">
                  {t(`home.quick_sims.${key}`)}
                </span>
              </button>
            ))}
            <button
              onClick={() => navigate('/simulate')}
              className="flex items-center gap-2 px-5 py-3 bg-card border border-border rounded-xl hover:border-accent/50 text-muted hover:text-text transition-all duration-200 font-medium"
            >
              {t('home.training_see_all')}
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
          <h2 className="text-2xl sm:text-3xl font-bold">{t('home.cta_title')}</h2>
          <p className="text-muted max-w-xl mx-auto">{t('home.cta_sub')}</p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="btn-primary mx-auto"
          >
            <Zap className="w-5 h-5" />
            {t('home.cta_btn')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Footer note */}
        <div className="text-center text-xs text-muted space-y-2 pt-8 border-t border-border">
          <p>{t('home.footer_note')}</p>
        </div>

      </div>
    </>
  )
}
