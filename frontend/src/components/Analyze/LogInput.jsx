import { useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import { useDropzone } from 'react-dropzone'
import { Zap, ArrowRight, Shield, Terminal, Upload } from 'lucide-react'

export function LogInput({ value, onChange, disabled, onAnalyze, onExample }) {
  const [uploadedFiles, setUploadedFiles] = useState([])

  const onDrop = useCallback(async (files) => {
    const file = files[0]
    if (!file) return
    const text = await file.text()
    onChange(text)
    setUploadedFiles(prev => {
      const next = [file.name, ...prev.filter(n => n !== file.name)].slice(0, 2)
      return next
    })
  }, [onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/*': ['.log', '.txt', '.json'] },
    maxFiles: 1,
    disabled,
    noClick: true,
  })

  const isEmpty = !value && !isDragActive

  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-[0_8px_32px_rgba(0,0,0,0.4)]">

      {/* Title bar — macOS style */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a2e] border-b border-border">
        {/* Traffic lights */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110 cursor-default" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-110 cursor-default" />
          <div className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-110 cursor-default" />
        </div>
        {/* File tabs */}
        <div className="flex items-center gap-2">
          {uploadedFiles.length > 0 ? (
            uploadedFiles.map(name => (
              <span
                key={name}
                className="flex items-center gap-1.5 text-xs text-muted px-2 py-1 rounded bg-border/40 font-mono"
              >
                <Terminal className="w-3 h-3 text-accent" />
                {name}
              </span>
            ))
          ) : (
            <>
              <span className="flex items-center gap-1.5 text-xs text-muted/40 px-2 py-1 rounded font-mono">
                <Terminal className="w-3 h-3" />
                incident.log
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted/40 px-2 py-1 rounded font-mono">
                <Terminal className="w-3 h-3" />
                errors.json
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main drop zone + textarea */}
      <div
        {...getRootProps()}
        className={`relative transition-all duration-300 bg-[#10101a] ${
          isDragActive ? 'bg-accent/5' : ''
        }`}
      >
        <input {...getInputProps()} />

        {isEmpty ? (
          /* Empty state — terminal icon + instructions */
          <div className="h-56 flex flex-col items-center justify-center gap-4 px-4 cursor-text"
               onClick={() => document.querySelector('#log-textarea')?.focus()}
          >
            {isDragActive ? (
              <>
                <Upload className="w-12 h-12 text-accent animate-bounce" />
                <p className="text-accent font-semibold">Suelta el archivo aquí</p>
              </>
            ) : (
              <>
                <div className="relative">
                  <div className="text-4xl font-mono text-muted/30 select-none tracking-widest">
                    &gt;_
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-2 h-4 bg-accent/70 animate-pulse rounded-sm" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-semibold text-text/80">Arrastra tus archivos aquí o pega el texto</p>
                  <p className="text-sm text-muted">Soporta .log, .txt, .json o texto plano</p>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Text state — editable textarea */
          <textarea
            id="log-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full h-56 bg-transparent resize-none px-5 py-4 text-sm font-mono text-text/90 placeholder-muted/40 focus:outline-none leading-relaxed"
            spellCheck={false}
            autoFocus
          />
        )}

        {/* Drag overlay border pulse */}
        {isDragActive && (
          <div className="absolute inset-0 border-2 border-accent drag-active rounded-none pointer-events-none" />
        )}
      </div>

      {/* Bottom bar — privacy + actions */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0d0d1a] border-t border-border gap-3">
        {/* Privacy note */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted/60 shrink-0">
          <Shield className="w-3.5 h-3.5 text-success/70 shrink-0" />
          <span>Privacidad garantizada. No usamos tus logs para entrenar modelos.</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onExample}
            disabled={disabled}
            className="text-sm text-muted hover:text-text transition-colors px-4 py-2 rounded-lg hover:bg-white/5 border border-border/50 whitespace-nowrap"
          >
            Probar ejemplo
          </button>
          <button
            onClick={onAnalyze}
            disabled={disabled || !value?.trim()}
            className="btn-primary text-sm py-2 whitespace-nowrap"
          >
            <Zap className="w-4 h-4" />
            Generar Postmortem
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

LogInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onAnalyze: PropTypes.func.isRequired,
  onExample: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
}

LogInput.defaultProps = {
  disabled: false,
}
