import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FlaskConical, Dice6 } from 'lucide-react'
import { IncidentTypeGrid } from '../components/Simulate/IncidentTypeGrid'
import { ParameterSelectors } from '../components/Simulate/ParameterSelectors'
import { PostmortemView } from '../components/Postmortem/PostmortemView'
import { CodeBlock } from '../components/UI/CodeBlock'
import { GeneratingState } from '../components/UI/LoadingSpinner'
import { useToast } from '../components/UI/Toast'
import { simulate } from '../services/api'

const DEFAULT_PARAMS = {
  severity: 'P1',
  tech_stack: 'nodejs',
  infrastructure: 'aws',
  complexity: 'moderate',
}

export function SimulatePage() {
  const location = useLocation()
  const toast = useToast()
  const [params, setParams] = useState({
    ...DEFAULT_PARAMS,
    incident_type: location.state?.incident_type || 'database_outage',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleGenerate = async () => {
    setLoading(true)
    setResult(null)
    try {
      const data = await simulate(params)
      setResult(data)
    } catch (e) {
      toast(e.message || 'Error al generar la simulación', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <FlaskConical className="w-6 h-6 text-cyan" />
          <h1 className="text-2xl font-bold">Modo Simulación</h1>
        </div>
        <p className="text-muted">Genera escenarios de incidentes realistas para entrenar a tus equipos DevOps y SRE.</p>
      </motion.div>

      <div className="card space-y-6">
        <h2 className="font-semibold text-text">Selecciona el Tipo de Incidente</h2>
        <IncidentTypeGrid selected={params.incident_type} onSelect={(t) => setParams(p => ({ ...p, incident_type: t }))} />

        <hr className="border-border" />
        <ParameterSelectors params={params} onChange={setParams} />

        <div className="flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Generando...</span>
              </span>
            ) : (
              <>
                <Dice6 className="w-4 h-4" />
                <span>Generar Simulación</span>
              </>
            )}
          </button>
        </div>
      </div>

      {loading && (
        <div className="card">
          <GeneratingState text="Claude está generando un incidente realista..." />
        </div>
      )}

      {result && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Generated logs */}
          <div className="space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse-slow" />
              <span>Logs Generados</span>
            </h2>
            <CodeBlock code={result.logs} title="incident.log" language="log" />
          </div>

          {/* Postmortem */}
          <div className="space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse-slow" />
              <span>Postmortem Generado</span>
            </h2>
            <div className="card">
              <PostmortemView postmortem={result.postmortem} showExport />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
