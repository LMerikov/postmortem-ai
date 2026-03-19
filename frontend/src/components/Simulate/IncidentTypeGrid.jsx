const INCIDENT_TYPES = [
  { id: 'database_outage',       icon: '🗄️',  label: 'Caída de BD' },
  { id: 'memory_leak',           icon: '💾',  label: 'Fuga de Memoria' },
  { id: 'ddos_attack',           icon: '🛡️',  label: 'Ataque DDoS' },
  { id: 'dns_failure',           icon: '📡',  label: 'Fallo DNS' },
  { id: 'bad_deployment',        icon: '🚀',  label: 'Mal Deploy' },
  { id: 'certificate_expiration',icon: '🔒',  label: 'SSL Expirado' },
  { id: 'api_rate_limiting',     icon: '⚡',  label: 'Rate Limiting' },
  { id: 'disk_space_full',       icon: '💿',  label: 'Disco Lleno' },
  { id: 'cascading_failure',     icon: '🌊',  label: 'Fallo en Cascada' },
  { id: 'security_breach',       icon: '🔑',  label: 'Brecha de Seguridad' },
]

export function IncidentTypeGrid({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      {INCIDENT_TYPES.map(({ id, icon, label }) => {
        const active = selected === id
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`p-3 rounded-xl border text-center transition-all duration-200 hover:scale-105 ${
              active
                ? 'border-accent bg-accent/15 glow-accent'
                : 'border-border bg-card hover:border-accent/50 hover:bg-accent/5'
            }`}
          >
            <div className="text-2xl mb-1">{icon}</div>
            <div className={`text-xs font-medium ${active ? 'text-accent' : 'text-muted'}`}>{label}</div>
          </button>
        )
      })}
    </div>
  )
}
