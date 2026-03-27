import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { PostmortemView } from '../components/Postmortem/PostmortemView'
import { PostmortemSkeleton } from '../components/UI/SkeletonLoader'
import { getPostmortem } from '../services/api'
import { useToast } from '../components/UI/Toast'

export function ResultPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [pm, setPm] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPostmortem(id)
      .then(data => setPm(data.data))
      .catch(() => { toast('Postmortem no encontrado', 'error'); navigate('/history') })
      .finally(() => setLoading(false))
  }, [id, toast, navigate])

  let content = null
  if (loading) {
    content = <PostmortemSkeleton />
  } else if (pm) {
    content = (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card">
        <PostmortemView postmortem={pm} showExport />
      </motion.div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="btn-secondary text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
      </div>
      {content}
    </div>
  )
}
