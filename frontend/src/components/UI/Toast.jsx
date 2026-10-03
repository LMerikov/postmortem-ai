import PropTypes from 'prop-types'
import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

const ToastContext = createContext(null)

const BLOCK = { success: 'bg-fac-white', error: 'bg-fac-red', info: 'bg-fac-grey' }

/**
 * toast(message, type?, options?)
 * options: { duration?: number, action?: { label: string, onClick: () => void } }
 * A number as third argument is still accepted as duration.
 */
export function ToastProvider({ children }) {
  const { t } = useTranslation()
  const [toasts, setToasts] = useState([])
  const seq = useRef(0)

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(item => item.id !== id))
  }, [])

  const toast = useCallback((message, type = 'info', options = {}) => {
    const opts = typeof options === 'number' ? { duration: options } : options
    const id = ++seq.current
    const duration = opts.duration ?? (opts.action ? 6000 : 3500)
    setToasts(prev => [...prev, { id, message, type, action: opts.action }])
    setTimeout(() => remove(id), duration)
  }, [remove])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:inset-x-auto sm:bottom-6 sm:right-6"
      >
        <AnimatePresence>
          {toasts.map(item => (
            <motion.div
              key={item.id}
              role={item.type === 'error' ? 'alert' : 'status'}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex w-full items-stretch gap-3 border border-line/70 bg-bg pr-2 sm:w-auto sm:min-w-72 sm:max-w-sm"
            >
              <span className={`w-1.5 self-stretch ${BLOCK[item.type]}`} aria-hidden="true" />
              <span className="flex-1 py-3 text-sm text-text">{item.message}</span>
              {item.action && (
                <button
                  type="button"
                  onClick={() => { item.action.onClick(); remove(item.id) }}
                  className="self-center px-2 py-1 caps text-text underline underline-offset-4 hover:bg-subtle"
                >
                  {item.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="self-center p-1 text-muted hover:text-text"
                aria-label={t('common.close')}
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export function useToast() {
  return useContext(ToastContext)
}
