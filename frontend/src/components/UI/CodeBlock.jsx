import PropTypes from 'prop-types'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useToast } from './Toast'

export function CodeBlock({ code, language = 'log', title = '' }) {
  const [copied, setCopied] = useState(false)
  const toast = useToast()

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast('Copied to clipboard!', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl overflow-hidden border border-border">
      <div className="flex items-center justify-between bg-code px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-p0/70" />
            <div className="w-3 h-3 rounded-full bg-p2/70" />
            <div className="w-3 h-3 rounded-full bg-success/70" />
          </div>
          {title && <span className="text-muted text-xs font-mono ml-2">{title}</span>}
        </div>
        <button
          onClick={handleCopy}
          className="text-muted hover:text-text transition-colors p-1 rounded"
        >
          {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <pre className="bg-code p-4 overflow-x-auto text-sm font-mono text-cyan/90 leading-relaxed rounded-none m-0">
        {code}
      </pre>
    </div>
  )
}

CodeBlock.propTypes = {
  code: PropTypes.string.isRequired,
  language: PropTypes.string,
  title: PropTypes.string,
}

CodeBlock.defaultProps = {
  language: 'log',
  title: '',
}
