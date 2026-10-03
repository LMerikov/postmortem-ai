import PropTypes from 'prop-types'
import { Component } from 'react'
import i18n from '../../i18n'

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
      const t = i18n.t.bind(i18n)
      return (
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="card w-full max-w-md space-y-4 text-center">
            <p className="display-wide text-5xl text-text" aria-hidden="true">INC ERR</p>
            <h2 className="caps-lg text-text">{t('common.errorTitle')}</h2>
            <p className="break-all border border-border bg-input p-3 text-left font-mono text-sm text-muted">
              {this.state.error?.message || t('common.errorUnknown')}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="btn-primary w-full"
            >
              {t('common.retry')}
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
