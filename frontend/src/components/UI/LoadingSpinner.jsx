import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Check } from 'lucide-react'

export function LoadingSpinner({ size = 24, className = '' }) {
  return (
    <span
      role="presentation"
      className={`inline-block shrink-0 animate-spin rounded-full border-2 border-border border-t-accent-strong ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

/**
 * Loading panel with optional staged progress. Steps advance on a timer and
 * the last one stays active until the parent unmounts the component, so it
 * never claims to be done before the request actually resolves.
 */
export function GeneratingState({ text, steps = [], interval = 1800 }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (steps.length < 2) return undefined
    const id = setInterval(() => {
      setCurrent(c => Math.min(c + 1, steps.length - 1))
    }, interval)
    return () => clearInterval(id)
  }, [steps.length, interval])

  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-6 py-10">
      <div className="flex items-center gap-3">
        <LoadingSpinner size={20} />
        <p className="text-sm font-medium text-text">{text}</p>
      </div>
      {steps.length > 0 && (
        <ol className="w-full max-w-sm space-y-2.5">
          {steps.map((step, i) => {
            const done = i < current
            const active = i === current
            return (
              <li key={step} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                    done ? 'border-success/50 bg-success/15 text-success'
                      : active ? 'border-accent-strong text-accent-strong'
                      : 'border-border text-transparent'
                  }`}
                  aria-hidden="true"
                >
                  {done ? <Check className="h-3 w-3" /> : <span className={`h-1.5 w-1.5 rounded-full ${active ? 'animate-pulse bg-accent-strong' : ''}`} />}
                </span>
                <span className={`transition-colors duration-300 ${done || active ? 'text-text' : 'text-muted'}`}>{step}</span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

LoadingSpinner.propTypes = {
  size: PropTypes.number,
  className: PropTypes.string,
}

GeneratingState.propTypes = {
  text: PropTypes.string.isRequired,
  steps: PropTypes.arrayOf(PropTypes.string),
  interval: PropTypes.number,
}
