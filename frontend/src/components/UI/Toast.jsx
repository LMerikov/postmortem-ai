import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: <CheckCircle className="w-5 h-5 text-success" />,
  error: <XCircle className="w-5 h-5 text-p0" />,
  info: <AlertCircle className="w-5 h-5 text-p3" />,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3 shadow-lg min-w-64 max-w-xs"
            >
              {ICONS[t.type]}
              <span className="text-sm text-text flex-1">{t.message}</span>
              <button onClick={() => remove(t.id)} className="text-muted hover:text-text">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
