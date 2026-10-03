import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ChevronRight, FileQuestion } from 'lucide-react'
import { PostmortemView, PM_SECTIONS } from '../components/Postmortem/PostmortemView'
import { PostmortemSkeleton } from '../components/UI/SkeletonLoader'
import { getPostmortem } from '../services/api'

function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0])
  const key = ids.join('|')

  useEffect(() => {
    if (ids.length === 0) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -60% 0px' },
    )
    ids.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return active
}

function TableOfContents({ sections }) {
  const { t } = useTranslation()
  const active = useActiveSection(sections.map(s => s.id))
  return (
    <nav aria-label={t('result.contents')} className="sticky top-24 hidden self-start lg:block">
      <p className="mb-3 text-xs font-medium text-muted">{t('result.contents')}</p>
      <ul className="space-y-0.5 border-l border-border">
        {sections.map(({ id, label }) => {
          const isActive = active === id
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={isActive ? 'location' : undefined}
                className={`-ml-px block border-l py-1.5 pl-4 text-sm transition-colors ${
                  isActive ? 'border-accent-strong text-text' : 'border-transparent text-muted hover:text-text'
                }`}
              >
                {t(label)}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

TableOfContents.propTypes = {
  sections: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, label: PropTypes.string })).isRequired,
}

export function ResultPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [pm, setPm] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    setStatus('loading')
    getPostmortem(id)
      .then(data => { setPm(data.data); setStatus('ready') })
      .catch(() => setStatus('missing'))
  }, [id])

  const sections = pm ? PM_SECTIONS.filter(s => s.has(pm)) : []

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1.5 text-sm text-muted">
          <li><Link to="/history" className="rounded hover:text-text">{t('result.back')}</Link></li>
          <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
          <li aria-current="page" className="max-w-[60vw] truncate text-text">{pm?.title || t('result.current')}</li>
        </ol>
      </nav>

      {status === 'loading' && <div className="max-w-3xl"><PostmortemSkeleton /></div>}

      {status === 'missing' && (
        <div className="card mx-auto max-w-md space-y-4 text-center">
          <FileQuestion className="mx-auto h-10 w-10 text-muted" aria-hidden="true" />
          <p className="text-text">{t('result.notFound')}</p>
          <Link to="/history" className="btn-secondary">{t('dashboard.history')}</Link>
        </div>
      )}

      {status === 'ready' && pm && (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_200px]">
          <motion.div
            initial={{ y: 8 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="card sm:p-8"
          >
            <PostmortemView postmortem={pm} showExport />
          </motion.div>
          <TableOfContents sections={sections} />
        </div>
      )}
    </div>
  )
}
