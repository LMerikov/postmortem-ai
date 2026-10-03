import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet'
import { Zap, History, Github, Menu, X, BarChart2 } from 'lucide-react'

const LANGS = ['es', 'en']

function LanguageSwitch() {
  const { t, i18n } = useTranslation()
  return (
    <div role="group" aria-label={t('nav.language')} className="flex items-center rounded-lg border border-border p-0.5">
      {LANGS.map((lng) => {
        const active = i18n.resolvedLanguage === lng
        return (
          <button
            key={lng}
            type="button"
            onClick={() => i18n.changeLanguage(lng)}
            aria-pressed={active}
            className={`rounded-md px-2 py-1 font-mono text-xs uppercase transition-colors ${
              active ? 'bg-subtle text-text' : 'text-muted hover:text-text'
            }`}
          >
            {lng}
          </button>
        )
      })}
    </div>
  )
}

export function Navbar() {
  const { t, i18n } = useTranslation()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => setMenuOpen(false), [pathname])

  const links = [
    { to: '/',          label: t('nav.analyze'),   Icon: Zap },
    { to: '/history',   label: t('nav.history'),   Icon: History },
    { to: '/dashboard', label: t('nav.dashboard'), Icon: BarChart2 },
  ]

  const isActive = (to) =>
    to === '/' ? pathname === '/' : pathname.startsWith(to) || (to === '/history' && pathname.startsWith('/result'))

  return (
    <>
    <Helmet>
      <html lang={i18n.language} />
      <title>{t('home.metaTitle')}</title>
    </Helmet>
    <nav aria-label={t('nav.primary')} className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        <Link to="/" className="flex items-center gap-2.5 rounded-lg">
          <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="#6C5CE7" fillOpacity="0.16" />
            <path d="M6 18h5l2.5-7 4 12 2.5-5H26" fill="none" stroke="#8B7CF6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[17px] font-semibold tracking-tight">
            Postmortem<span className="text-muted">.ai</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map(({ to, label, Icon }) => {
            const active = isActive(to)
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? 'page' : undefined}
                className="relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors hover:bg-card"
              >
                {active && (
                  <motion.span
                    layoutId="navbar-indicator"
                    className="absolute inset-0 rounded-lg border border-border bg-card"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <span className={`relative flex items-center gap-2 ${active ? 'text-text' : 'text-muted'}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />{label}
                </span>
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitch />
          <a
            href="https://github.com/LMerikov/postmortem-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="icon-btn"
            aria-label={t('nav.github')}
            title={t('nav.github')}
          >
            <Github className="h-5 w-5" />
          </a>
          <button
            type="button"
            className="icon-btn md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border md:hidden"
          >
            <div className="space-y-1 px-4 py-3">
              {links.map(({ to, label, Icon }) => {
                const active = isActive(to)
                return (
                  <Link
                    key={to}
                    to={to}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      active ? 'border border-border bg-card text-text' : 'text-muted hover:bg-card hover:text-text'
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />{label}
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    </>
  )
}
