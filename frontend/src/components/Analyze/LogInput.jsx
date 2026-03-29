import { useCallback, useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { useDropzone } from 'react-dropzone'
import { Zap, ArrowRight, Shield, Terminal, Upload } from 'lucide-react'

export function LogInput({ value, onChange, disabled, onAnalyze, onExample }) {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [focused, setFocused] = useState(false)
  const textareaRef = useRef(null)

  const onDrop = useCallback(async (files) => {
    const file = files[0]
    if (!file) return
    const text = await file.text()
    onChange(text)
    setUploadedFiles(prev => {
      const next = [file.name, ...prev.filter(n => n !== file.name)].slice(0, 2)
      return next
    })
    setTimeout(() => textareaRef.current?.focus(), 0)
  }, [onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/*': ['.log', '.txt', '.json'] },
    maxFiles: 1,
    disabled,
    noClick: false,
  })

  const isEmpty = !value && !isDragActive

  const handleClick = () => {
    textareaRef.current?.focus()
  }

  const handleFocus = () => {
    setFocused(true)
  }

  const handleBlur = () => {
    setFocused(false)
  }

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
                className="flex items-center gap-1.5 text-xs text-text px-3 py-1 rounded bg-card/60 border border-border/50 font-mono"
              >
                <Terminal className="w-3 h-3 text-accent" />
                {name}
              </span>
            ))
          ) : (
            <>
              <span className="flex items-center gap-1.5 text-xs text-muted/50 px-3 py-1 rounded font-mono">
                <Terminal className="w-3 h-3" />
                incident.log
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted/50 px-3 py-1 rounded font-mono">
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
        className={`relative transition-all duration-200 bg-[#10101a] ${
          isDragActive ? 'bg-accent/10 border-accent' : ''
        } ${focused ? 'ring-2 ring-accent/40' : ''}`}
      >
        <input {...getInputProps()} />

        {/* Textarea — siempre presente */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className="w-full h-56 bg-transparent resize-none px-5 py-4 text-sm font-mono text-text placeholder-muted/40 focus:outline-none leading-relaxed relative z-10"
          spellCheck={false}
          placeholder="Pega logs, stacktraces o describe qué salió mal..."
        />

        {/* Empty state overlay — desaparece al escribir o hacer foco */}
        {isEmpty && !focused && !isDragActive && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 pointer-events-none"
            onClick={handleClick}
          >
            <div className="text-5xl font-mono text-muted/20 select-none tracking-widest">
              &gt;_
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm text-muted/70">Arrastra archivos aquí o haz clic para escribir</p>
              <p className="text-xs text-muted/50">Soporta .log, .txt, .json o texto plano</p>
            </div>
          </div>
        )}

        {/* Drag overlay */}
        {isDragActive && (
          <>
            <div className="absolute inset-0 border-2 border-accent drag-active rounded-none pointer-events-none z-20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none z-20">
              <Upload className="w-12 h-12 text-accent animate-bounce" />
              <p className="text-accent font-semibold">Suelta el archivo aquí</p>
            </div>
          </>
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
