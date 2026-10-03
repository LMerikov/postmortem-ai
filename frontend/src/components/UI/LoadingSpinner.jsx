import PropTypes from 'prop-types'

export function LoadingSpinner({ size = 24, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 animate-spin rounded-full border-2 border-border border-t-text ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

LoadingSpinner.propTypes = {
  size: PropTypes.number,
  className: PropTypes.string,
}
