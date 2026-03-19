import { Users, Clock, Server, DollarSign } from 'lucide-react'

export function ImpactCard({ impact = {} }) {
  const items = [
    { icon: <Users className="w-4 h-4 text-p3" />, label: 'Usuarios Afectados', value: impact.users_affected },
    { icon: <Clock className="w-4 h-4 text-p1" />,  label: 'Duración',          value: impact.duration },
    { icon: <Server className="w-4 h-4 text-accent" />, label: 'Servicios',      value: (impact.services_affected || []).join(', ') },
    { icon: <DollarSign className="w-4 h-4 text-p2" />, label: 'Impacto $',      value: impact.revenue_impact },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(({ icon, label, value }) => (
        <div key={label} className="bg-input border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-muted">{label}</span></div>
          <p className="text-sm text-text font-medium truncate" title={value || 'Unknown'}>
            {value || 'Desconocido'}
          </p>
        </div>
      ))}
    </div>
  )
}
