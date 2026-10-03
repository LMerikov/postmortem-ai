import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
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
      <p className="caps mb-4 text-muted">{t('result.contents')}</p>
      <ul className="border-t border-border">
        {sections.map(({ id, label }) => {
          const isActive = active === id
          return (
            <li key={id} className="border-b border-border">
              <a
                href={`#${id}`}
                aria-current={isActive ? 'location' : undefined}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 text-sm transition-colors ${
                  isActive ? 'bg-text text-bg' : 'text-muted hover:bg-subtle hover:text-text'
                }`}
              >
                <span>{t(label)}</span>
                {isActive && <span className="h-2 w-2 shrink-0 bg-fac-red" aria-hidden="true" />}
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="caps flex items-center gap-3 text-muted">
          <li><Link to="/history" className="hover:text-text">{t('result.back')}</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="max-w-[60vw] truncate font-sans text-sm normal-case tracking-normal text-text [font-stretch:100%]">{pm?.title || t('result.current')}</li>
        </ol>
      </nav>

      {status === 'loading' && <div className="max-w-3xl"><PostmortemSkeleton /></div>}

      {status === 'missing' && (
        <div className="max-w-xl space-y-6 border border-line/70 p-8">
          <p className="display-wide text-6xl" aria-hidden="true">INC 404</p>
          <p className="text-muted">{t('result.notFound')}</p>
          <Link to="/history" className="btn-secondary">{t('dashboard.history')}</Link>
        </div>
      )}

      {status === 'ready' && pm && (
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[190px_minmax(0,1fr)]">
          <TableOfContents sections={sections} />
          <motion.div
            className="min-w-0"
            initial={{ y: 8 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <PostmortemView postmortem={pm} id={id} showExport />
          </motion.div>
        </div>
      )}
    </div>
  )
}
