import { motion } from 'framer-motion'

const INCIDENT_TYPES = [
  { id: 'database_outage',        icon: '🗄️', label: 'Caída de BD',         color: 'p0' },
  { id: 'memory_leak',            icon: '💾', label: 'Fuga de Memoria',      color: 'p1' },
  { id: 'ddos_attack',            icon: '🛡️', label: 'Ataque DDoS',          color: 'p0' },
  { id: 'dns_failure',            icon: '📡', label: 'Fallo DNS',            color: 'p1' },
  { id: 'bad_deployment',         icon: '🚀', label: 'Mal Deploy',           color: 'p2' },
  { id: 'certificate_expiration', icon: '🔒', label: 'SSL Expirado',         color: 'p2' },
  { id: 'api_rate_limiting',      icon: '⚡', label: 'Rate Limiting',        color: 'p3' },
  { id: 'disk_space_full',        icon: '💿', label: 'Disco Lleno',          color: 'p2' },
  { id: 'cascading_failure',      icon: '🌊', label: 'Fallo en Cascada',     color: 'p0' },
  { id: 'security_breach',        icon: '🔑', label: 'Brecha de Seguridad',  color: 'p0' },
]

// Clases de glow y color por severidad de tipo
const COLOR_MAP = {
  p0: {
    active:   'border-p0/60 bg-p0/10 shadow-[0_0_16px_rgba(255,107,107,0.25)]',
    hover:    'hover:border-p0/40 hover:bg-p0/5',
    text:     'text-p0',
  },
  p1: {
    active:   'border-p1/60 bg-p1/10 shadow-[0_0_16px_rgba(255,165,2,0.25)]',
    hover:    'hover:border-p1/40 hover:bg-p1/5',
    text:     'text-p1',
  },
  p2: {
    active:   'border-p2/60 bg-p2/10 shadow-[0_0_16px_rgba(254,202,87,0.20)]',
    hover:    'hover:border-p2/40 hover:bg-p2/5',
    text:     'text-p2',
  },
  p3: {
    active:   'border-p3/60 bg-p3/10 shadow-[0_0_16px_rgba(72,219,251,0.20)]',
    hover:    'hover:border-p3/40 hover:bg-p3/5',
    text:     'text-p3',
  },
}

export function IncidentTypeGrid({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      {INCIDENT_TYPES.map(({ id, icon, label, color }, i) => {
        const active = selected === id
        const c = COLOR_MAP[color]
        return (
          <motion.button
            key={id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(id)}
            className={`p-3 rounded-xl border text-center transition-all duration-200 ${
              active
                ? c.active
                : `border-border bg-card ${c.hover}`
            }`}
          >
            <div className="text-2xl mb-1">{icon}</div>
            <div className={`text-xs font-medium leading-tight ${active ? c.text : 'text-muted'}`}>
              {label}
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
