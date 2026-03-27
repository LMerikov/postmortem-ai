import PropTypes from 'prop-types'

export function LoadingSpinner({ size = 24, className = '' }) {
  return (
    <div
      className={`rounded-full border-2 border-border border-t-accent animate-spin ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

export function GeneratingState({ text = 'Analizando con IA...' }) {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <div className="relative">
        <LoadingSpinner size={48} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-accent text-xl">⚡</span>
        </div>
      </div>
      <p className="text-muted text-sm font-mono">{text}</p>
    </div>
  )
}

LoadingSpinner.propTypes = {
  size: PropTypes.number,
  className: PropTypes.string,
}

LoadingSpinner.defaultProps = {
  size: 24,
  className: '',
}

GeneratingState.propTypes = {
  text: PropTypes.string,
}

GeneratingState.defaultProps = {
  text: 'Analizando con IA...',
}
