import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet'
import { Github, Menu, X } from 'lucide-react'
import { ColorStrip } from '../Catalog/ColorStrip'

const LANGS = ['es', 'en']

function LanguageSwitch() {
  const { t, i18n } = useTranslation()
  return (
    <fieldset className="flex items-stretch border border-border">
      <legend className="sr-only">{t('nav.language')}</legend>
      {LANGS.map((lng) => {
        const active = i18n.resolvedLanguage === lng
        return (
          <button
            key={lng}
            type="button"
            onClick={() => i18n.changeLanguage(lng)}
            aria-pressed={active}
            className={`caps px-2.5 py-2 transition-colors ${
              active ? 'bg-text text-bg' : 'text-muted hover:text-text'
            }`}
          >
            {lng}
          </button>
        )
      })}
    </fieldset>
  )
}

export function Navbar() {
  const { t, i18n } = useTranslation()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => setMenuOpen(false), [pathname])

  const links = [
    { to: '/', label: t('nav.analyze') },
    { to: '/history', label: t('nav.history') },
    { to: '/dashboard', label: t('nav.dashboard') },
  ]

  const isActive = (to) =>
    to === '/' ? pathname === '/' : pathname.startsWith(to) || (to === '/history' && pathname.startsWith('/result'))

  return (
    <>
      <Helmet>
        <html lang={i18n.language} />
        <title>{t('home.metaTitle')}</title>
      </Helmet>
      <a
        href="#main"
        className="sr-only bg-text px-4 py-2 caps-lg text-bg focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
      >
        {t('nav.skip')}
      </a>
      <nav aria-label={t('nav.primary')} className="sticky top-0 z-40 border-b border-line/40 bg-bg">
        <div className="mx-auto flex h-16 max-w-7xl items-stretch justify-between px-4 sm:px-6 lg:px-8">

          <Link to="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
            <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
              <rect x="1" y="1" width="30" height="30" fill="none" stroke="#F2F2EC" strokeWidth="1.5" />
              <path d="M5 18h5l2.5-7 4 12 2.5-5H27" fill="none" stroke="#F2F2EC" strokeWidth="1.8" strokeLinejoin="miter" />
            </svg>
            <span className="flex min-w-0 flex-col gap-1.5">
              <span className="display-wide truncate text-[13px] uppercase leading-none sm:text-[17px]">Postmortem<span className="text-muted">.ai</span></span>
              <ColorStrip className="hidden sm:flex [&>li]:h-1 [&>li]:w-5" />
            </span>
          </Link>

          <div className="hidden items-stretch md:flex">
            {links.map(({ to, label }) => {
              const active = isActive(to)
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex items-center border-l border-border px-6 caps-lg transition-colors last:border-r ${
                    active ? 'bg-text text-bg' : 'text-muted hover:bg-subtle hover:text-text'
                  }`}
                >
                  {active && <span className="absolute inset-y-0 left-0 w-1 bg-fac-red" aria-hidden="true" />}
                  {label}
                </Link>
              )
            })}
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <LanguageSwitch />
            <a
              href="https://github.com/LMerikov/postmortem-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="icon-btn hidden sm:inline-flex"
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
              transition={{ duration: 0.15 }}
              className="overflow-hidden border-t border-border md:hidden"
            >
              <div className="flex flex-col">
                <a
                  href="https://github.com/LMerikov/postmortem-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="order-last border-b border-border px-6 py-4 caps-lg text-muted sm:hidden"
                >
                  {t('nav.github')}
                </a>
                {links.map(({ to, label }) => {
                  const active = isActive(to)
                  return (
                    <Link
                      key={to}
                      to={to}
                      aria-current={active ? 'page' : undefined}
                      className={`relative border-b border-border px-6 py-4 caps-lg ${
                        active ? 'bg-text text-bg' : 'text-muted'
                      }`}
                    >
                      {active && <span className="absolute inset-y-0 left-0 w-1 bg-fac-red" aria-hidden="true" />}
                      {label}
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
