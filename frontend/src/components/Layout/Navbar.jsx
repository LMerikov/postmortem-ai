import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, FlaskConical, History, Github, Menu, X } from 'lucide-react'

export function Navbar() {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = [
    { to: '/',         label: 'Analizar',  icon: <Zap          className="w-4 h-4" /> },
    { to: '/simulate', label: 'Simular',   icon: <FlaskConical className="w-4 h-4" /> },
    { to: '/history',  label: 'Historial', icon: <History      className="w-4 h-4" /> },
  ]

  const isActive = (to) =>
    to === '/' ? pathname === '/' : pathname.startsWith(to)

  return (
    <nav className="border-b border-border bg-bg/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group" onClick={() => setMenuOpen(false)}>
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-accent/20 rounded-lg group-hover:bg-accent/30 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center text-accent font-bold text-sm font-mono">
              PM
            </div>
          </div>
          <span className="font-bold text-lg">
            <span className="text-gradient">Postmortem</span>
            <span className="text-muted">.ai</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-1">
          {links.map(({ to, label, icon }) => {
            const active = isActive(to)
            return (
              <Link
                key={to}
                to={to}
                className="relative px-4 py-2 flex items-center gap-2 text-sm font-medium transition-colors rounded-lg hover:bg-card"
              >
                {active && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 bg-card rounded-lg border border-border"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className={`relative flex items-center gap-2 ${active ? 'text-text' : 'text-muted'}`}>
                  {icon}{label}
                </span>
              </Link>
            )
          })}
        </div>

        {/* GitHub + Hamburguesa */}
        <div className="flex items-center gap-1">
          <a
            href="https://github.com/LMerikov/postmortem-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-text transition-colors p-2 rounded-lg hover:bg-card"
            title="Ver en GitHub"
          >
            <Github className="w-5 h-5" />
          </a>

          {/* Hamburguesa — solo mobile */}
          <button
            className="sm:hidden p-2 rounded-lg hover:bg-card text-muted hover:text-text transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Abrir menú"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden border-t border-border overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {links.map(({ to, label, icon }) => {
                const active = isActive(to)
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-card border border-border text-text'
                        : 'text-muted hover:bg-card hover:text-text'
                    }`}
                  >
                    {icon}{label}
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
