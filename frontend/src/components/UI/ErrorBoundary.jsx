import PropTypes from 'prop-types'
import { Component } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center px-4">
          <div className="card max-w-md w-full text-center space-y-4">
            <div className="flex justify-center">
              <AlertTriangle className="w-12 h-12 text-p1" />
            </div>
            <h2 className="text-xl font-bold text-text">Algo salió mal</h2>
            <p className="text-muted text-sm font-mono bg-input rounded-lg p-3 text-left break-all">
              {this.state.error?.message || 'Error desconocido'}
            </p>
            <button
              onClick={() => this.setState({ error: null })}
              className="btn-primary justify-center w-full"
            >
              <RotateCcw className="w-4 h-4" />
              Reintentar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
}
