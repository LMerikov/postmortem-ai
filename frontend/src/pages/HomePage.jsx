import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ListOrdered, GitBranch, ListChecks, FileDown } from 'lucide-react'
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

const INCLUDES = [
  { key: 'timeline', Icon: ListOrdered },
  { key: 'cause', Icon: GitBranch },
  { key: 'actions', Icon: ListChecks },
  { key: 'export', Icon: FileDown },
]

const EASE = [0.16, 1, 0.3, 1]

export function HomePage() {
  const { t, i18n } = useTranslation()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [inputError, setInputError] = useState('')
  const [totalPostmortems, setTotalPostmortems] = useState(null)
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    getStats()
      .then(data => setTotalPostmortems(data.total_postmortems))
      .catch(() => {})
  }, [])

  const handleChange = (value) => {
    setContent(value)
    if (inputError) setInputError('')
  }

  const handleAnalyze = async () => {
    if (!content.trim()) {
      setInputError(t('home.emptyInput'))
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

      <div className="mx-auto max-w-5xl px-4 sm:px-6">

        <motion.header
          initial={{ y: 12 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="max-w-3xl pb-10 pt-14 sm:pt-20"
        >
          <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[3.5rem]">
            {t('home.title')}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {t('home.subtitle')}
          </p>
          {totalPostmortems > 0 && (
            <p className="mt-5 flex items-center gap-2 text-sm text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              <span className="tabular">
                {t('home.analyzed', { count: totalPostmortems, n: totalPostmortems.toLocaleString(i18n.language) })}
              </span>
            </p>
          )}
        </motion.header>

        <motion.section
          initial={{ y: 12 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
          aria-label={t('input.label')}
        >
          {loading ? (
            <div className="rounded-2xl border border-border bg-input">
              <GeneratingState
                text={t('home.loading')}
                steps={[t('home.steps.read'), t('home.steps.cause'), t('home.steps.write')]}
              />
            </div>
          ) : (
            <LogInput
              value={content}
              onChange={handleChange}
              disabled={loading}
              onAnalyze={handleAnalyze}
              onExample={() => handleChange(EXAMPLE_LOGS)}
              error={inputError}
            />
          )}
        </motion.section>

        <section className="grid gap-10 border-t border-border py-16 mt-20 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <h2 className="text-2xl font-semibold tracking-tight">{t('home.howTitle')}</h2>
          <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {INCLUDES.map(({ key, Icon }) => (
              <div key={key} className="space-y-2">
                <dt className="flex items-center gap-2.5 font-medium text-text">
                  <Icon className="h-4 w-4 text-accent-strong" aria-hidden="true" />
                  {t(`home.how.${key}.title`)}
                </dt>
                <dd className="text-sm leading-relaxed text-muted">{t(`home.how.${key}.desc`)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <footer className="flex flex-col gap-2 border-t border-border py-8 text-sm text-muted sm:flex-row sm:justify-between">
          <p>© 2026 Postmortem.ai</p>
          <p>{t('home.footer')}</p>
        </footer>
      </div>
    </>
  )
}
