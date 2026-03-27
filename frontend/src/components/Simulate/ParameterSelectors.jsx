import PropTypes from 'prop-types'

const SEVERITIES = ['P0', 'P1', 'P2', 'P3', 'P4']
const SEV_COLORS = { P0: 'text-p0 border-p0', P1: 'text-p1 border-p1', P2: 'text-p2 border-p2', P3: 'text-p3 border-p3', P4: 'text-p4 border-p4' }

const STACKS = [
  { value: 'nodejs', label: 'Node.js' }, { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' }, { value: 'go', label: 'Go' },
  { value: 'ruby', label: 'Ruby' }, { value: 'rust', label: 'Rust' },
]
const INFRAS = [
  { value: 'aws', label: 'AWS' }, { value: 'gcp', label: 'GCP' },
  { value: 'azure', label: 'Azure' }, { value: 'cubepath', label: 'CubePath' },
  { value: 'onpremise', label: 'On-Premise' },
]
const COMPLEXITIES = [
  { value: 'simple', label: 'Simple' },
  { value: 'moderate', label: 'Moderada' },
  { value: 'complex', label: 'Compleja' },
]

function SelectField({ label, value, options, onChange }) {
  const inputId = `select-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="text-sm text-muted font-medium">{label}</label>
      <select
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-base w-full text-sm appearance-none cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

export function ParameterSelectors({ params, onChange }) {
  const set = (key) => (val) => onChange({ ...params, [key]: val })

  return (
    <div className="space-y-5">
      {/* Severity */}
      <fieldset className="space-y-1.5">
        <legend className="text-sm text-muted font-medium">Severidad</legend>
        <div className="flex gap-2">
          {SEVERITIES.map(s => (
            <button
              key={s}
              onClick={() => set('severity')(s)}
              className={`flex-1 py-2 rounded-lg border font-mono text-sm font-bold transition-all duration-200 ${
                params.severity === s
                  ? `${SEV_COLORS[s]} bg-current/10`
                  : 'border-border text-muted hover:border-muted'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-3 gap-4">
        <SelectField label="Stack Tecnológico"  value={params.tech_stack}    options={STACKS}       onChange={set('tech_stack')} />
        <SelectField label="Infraestructura" value={params.infrastructure} options={INFRAS}  onChange={set('infrastructure')} />
        <SelectField label="Complejidad"  value={params.complexity}    options={COMPLEXITIES} onChange={set('complexity')} />
      </div>
    </div>
  )
}

SelectField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
}

ParameterSelectors.propTypes = {
  params: PropTypes.shape({
    severity: PropTypes.string,
    tech_stack: PropTypes.string,
    infrastructure: PropTypes.string,
    complexity: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
}
