import { useState, useEffect, useMemo, useRef } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { LogInput } from '../components/Analyze/LogInput'
import { SignalPlot } from '../components/Catalog/SignalPlot'
import { ColorStrip } from '../components/Catalog/ColorStrip'
import { AnalysisStatus } from '../components/UI/AnalysisStatus'
import { analyzeLogs, getStats } from '../services/api'
import { useToast } from '../components/UI/Toast'
import { logsPlot } from '../lib/incident'

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

const EXAMPLE_PLOT = logsPlot(EXAMPLE_LOGS)
const MAX_AUTO_RETRIES = 2
const EASE = [0.16, 1, 0.3, 1]

/** The submitted log stays on screen, read-only, while the model works. */
function SubmittedLog({ text, lines }) {
  const { t, i18n } = useTranslation()
  const preview = text.split('\n').filter(l => l.trim()).slice(0, 5).join('\n')
  return (
    <div className="border border-line/70 bg-input">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <p className="caps-lg">{t('input.sent')}</p>
        <p className="caps tabular text-muted">
          {t('input.sentCount', { lines, chars: text.length.toLocaleString(i18n.language) })}
        </p>
      </div>
      <pre className="m-0 max-h-[7.5rem] overflow-hidden whitespace-pre-wrap break-all bg-transparent px-5 py-4 text-[13px] leading-relaxed text-muted">
        {preview}
      </pre>
    </div>
  )
}

SubmittedLog.propTypes = {
  text: PropTypes.string.isRequired,
  lines: PropTypes.number.isRequired,
}

export function HomePage() {
  const { t, i18n } = useTranslation()
  const [content, setContent] = useState('')
  const [phase, setPhase] = useState('idle') // idle | loading | rate
  const [retryIn, setRetryIn] = useState(0)
  const [inputError, setInputError] = useState('')
  const [totalPostmortems, setTotalPostmortems] = useState(null)
  const abortRef = useRef(null)
  const countdownRef = useRef(null)
  const attemptsRef = useRef(0)
  const navigate = useNavigate()
  const toast = useToast()
  const plot = useMemo(() => logsPlot(content), [content])
  const busy = phase !== 'idle'
  const showExample = plot.lines === 0 && !busy

  useEffect(() => {
    getStats()
      .then(data => setTotalPostmortems(data.total_postmortems))
      .catch(() => {})
    return () => {
      abortRef.current?.abort()
      clearInterval(countdownRef.current)
    }
  }, [])

  const handleChange = (value) => {
    setContent(value)
    if (inputError) setInputError('')
  }

  const stop = () => {
    abortRef.current?.abort()
    clearInterval(countdownRef.current)
    attemptsRef.current = 0
    setRetryIn(0)
    setPhase('idle')
  }

  const startCountdown = (seconds) => {
    setPhase('rate')
    setRetryIn(seconds)
    clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => {
      setRetryIn((s) => {
        if (s <= 1) {
          clearInterval(countdownRef.current)
          run()
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  const run = async () => {
    const controller = new AbortController()
    abortRef.current = controller
    setPhase('loading')
    try {
      const result = await analyzeLogs(content, { signal: controller.signal })
      navigate(`/result/${result.id}`)
    } catch (e) {
      if (e.name === 'AbortError') return
      if (e.status === 429 && attemptsRef.current < MAX_AUTO_RETRIES) {
        attemptsRef.current += 1
        startCountdown(e.retryAfter || 30)
        return
      }
      const message = e.status === 429
        ? t('home.rateLimited', { seconds: e.retryAfter || 60 })
        : t('home.analyzeError')
      toast(message, 'error', { duration: 8000 })
      stop()
    }
  }

  const handleAnalyze = () => {
    if (!content.trim()) {
      setInputError(t('home.emptyInput'))
      return
    }
    attemptsRef.current = 0
    run()
  }

  return (
    <>
      <Helmet>
        <html lang={i18n.language} />
        <title>{t('home.metaTitle')}</title>
        <meta name="description" content={t('home.metaDescription')} />
        <meta property="og:title" content={t('home.metaTitle')} />
        <meta property="og:description" content={t('home.metaDescription')} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Postmortem.ai',
          description: t('home.metaDescription'),
          applicationCategory: 'DeveloperApplication',
          url: 'https://postmortem-ai.xyz',
        })}</script>
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* One grid, two reading orders: headline → form → trace on phones, headline | trace then form on desktop. */}
        <div className="grid grid-cols-1 gap-x-10 gap-y-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:items-center">

          <motion.div
            initial={{ y: 12 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="order-1 min-w-0 space-y-6 lg:col-start-1 lg:row-start-1 lg:space-y-8"
          >
            <h1
              className="max-w-[17ch] font-display text-[clamp(2.2rem,5.4vw,4.4rem)] font-medium leading-[1.02] tracking-[-0.025em]"
              style={{ fontStretch: '108%' }}
            >
              {t('home.title')}
            </h1>
            <p className="max-w-[50ch] text-lg leading-relaxed text-muted">{t('home.subtitle')}</p>
            {totalPostmortems > 0 && (
              <p className="tabular text-sm text-muted">
                {t('home.analyzed', { count: totalPostmortems, n: totalPostmortems.toLocaleString(i18n.language) })}
              </p>
            )}
          </motion.div>

          <motion.section
            initial={{ y: 12 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
            aria-label={t('input.label')}
            className="order-2 min-w-0 lg:col-span-2 lg:row-start-2"
          >
            {busy ? (
              <SubmittedLog text={content} lines={plot.lines} />
            ) : (
              <LogInput
                value={content}
                onChange={handleChange}
                disabled={busy}
                onAnalyze={handleAnalyze}
                onExample={() => handleChange(EXAMPLE_LOGS)}
                error={inputError}
              />
            )}
          </motion.section>

          <figure className="order-3 min-w-0 space-y-4 lg:col-start-2 lg:row-start-1">
            <SignalPlot
              values={showExample ? EXAMPLE_PLOT.values : plot.values}
              ghost={showExample}
              label={showExample ? t('catalog.example') : t('catalog.inputPlotLabel', { lines: plot.lines })}
              scanning={busy}
              className="mx-auto w-full max-w-[200px] sm:max-w-[300px] lg:max-w-[380px]"
            />
            {busy ? (
              <AnalysisStatus retryIn={phase === 'rate' ? retryIn : 0} onCancel={stop} />
            ) : (
              <figcaption className="caps flex justify-between gap-4 text-muted">
                {showExample ? (
                  <span>{t('catalog.example')}</span>
                ) : (
                  <>
                    <span>{t('catalog.inputSignal', { count: plot.lines })}</span>
                    <span className="tabular">{t('catalog.errWarn', { errors: plot.errors, warnings: plot.warnings })}</span>
                  </>
                )}
              </figcaption>
            )}
            <p className="text-[13px] leading-relaxed text-muted">{showExample ? t('catalog.exampleHint') : t('catalog.howToRead')}</p>
          </figure>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line/50 py-6">
          <ColorStrip />
          <p className="max-w-[56ch] text-sm leading-relaxed text-muted">{t('home.includes')}</p>
        </div>

        <footer className="flex flex-col gap-2 border-t border-border py-8 text-sm text-muted sm:flex-row sm:justify-between">
          <p>© 2026 Postmortem.ai</p>
          <p>{t('home.footer')}</p>
        </footer>
      </div>
    </>
  )
}
