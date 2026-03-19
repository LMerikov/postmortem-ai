import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { History } from 'lucide-react'
import { HistoryList } from '../components/History/HistoryList'
import { LoadingSpinner } from '../components/UI/LoadingSpinner'
import { getPostmortems, deletePostmortem } from '../services/api'
import { useToast } from '../components/UI/Toast'

export function HistoryPage() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPostmortems()
      .then(setItems)
      .catch(() => toast('Error al cargar el historial', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id) => {
    try {
      await deletePostmortem(id)
      setItems(prev => prev.filter(p => p.id !== id))
      toast('Postmortem eliminado', 'success')
    } catch {
      toast('Error al eliminar', 'error')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <History className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-bold">Historial</h1>
        </div>
        {!loading && (
          <p className="text-muted text-sm">
            {items.length} {items.length === 1 ? 'postmortem generado' : 'postmortems generados'}
          </p>
        )}
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size={32} /></div>
      ) : (
        <HistoryList items={items} onDelete={handleDelete} />
      )}
    </div>
  )
}
