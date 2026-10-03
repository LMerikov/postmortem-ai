import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ColorStrip } from '../components/Catalog/ColorStrip'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start gap-8 px-4 py-24 sm:px-6">
      <p className="display-wide text-[clamp(4rem,14vw,8rem)]" aria-hidden="true">INC 404</p>
      <ColorStrip />
      <div className="space-y-3">
        <h1 className="caps-lg">{t('notFound.title')}</h1>
        <p className="max-w-[48ch] text-muted">{t('notFound.body')}</p>
      </div>
      <Link to="/" className="btn-primary">{t('notFound.cta')}</Link>
    </div>
  )
}
