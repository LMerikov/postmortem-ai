import { useCallback, useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { useDropzone } from 'react-dropzone'
import { Zap, ArrowRight, Shield, Terminal, Upload, FolderOpen, AlertCircle } from 'lucide-react'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function LogInput({ value, onChange, disabled, onAnalyze, onExample }) {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [focused, setFocused] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  const handleFileRead = useCallback(async (file) => {
    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(0)
      const fileMB = (file.size / 1024 / 1024).toFixed(1)
      setError(`Archivo demasiado grande: ${fileMB}MB. Máximo permitido: ${sizeMB}MB`)
      return false
    }

    try {
      const text = await file.text()
      onChange(text)
      setUploadedFiles(prev =>
        [file.name, ...prev.filter(n => n !== file.name)].slice(0, 2)
      )
      setError('')
      setTimeout(() => textareaRef.current?.focus(), 0)
      return true
    } catch (err) {
      setError(`Error al leer archivo: ${err.message}`)
      return false
    }
  }, [onChange])

  const onDrop = useCallback(async (files) => {
    const file = files[0]
    if (!file) return
    await handleFileRead(file)
  }, [handleFileRead])

  // Dropzone solo para drag & drop — click desactivado
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/*': ['.log', '.txt', '.json'] },
    maxFiles: 1,
    disabled,
    noClick: true,   // ← no abrir explorador al hacer clic
    noKeyboard: true,
  })

  // Input file separado — se activa solo desde el botón de la tab
  const handleFileTabClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    await handleFileRead(file)
    e.target.value = ''
  }

  const showOverlay = !value && !focused && !isDragActive

  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-[0_8px_32px_rgba(0,0,0,0.4)]">

      {/* Title bar — macOS style */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1a1a2e] border-b border-border">

        {/* Traffic lights */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>

        {/* File tabs — clickeables para subir archivo */}
        <div className="flex items-center gap-1.5">
          {uploadedFiles.length > 0 ? (
            uploadedFiles.map(name => (
              <span
                key={name}
                className="flex items-center gap-1.5 text-xs text-text/80 px-3 py-1 rounded-md bg-card/70 border border-border/60 font-mono"
              >
                <Terminal className="w-3 h-3 text-accent" />
                {name}
              </span>
            ))
          ) : null}

          {/* Botón para abrir explorador */}
          <button
            type="button"
            onClick={handleFileTabClick}
            disabled={disabled}
            title="Abrir archivo"
            className="flex items-center gap-1.5 text-xs text-muted/60 hover:text-text/80 px-3 py-1 rounded-md hover:bg-white/5 border border-transparent hover:border-border/40 font-mono transition-all duration-150"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Abrir archivo</span>
          </button>

          {/* Input file oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".log,.txt,.json,text/*"
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main area — drag & drop + textarea */}
      <div
        {...getRootProps()}
        className={`relative bg-[#10101a] transition-all duration-200 ${
          isDragActive ? 'bg-accent/5' : ''
        } ${focused ? 'ring-2 ring-inset ring-accent/30' : ''}`}
      >
        <input {...getInputProps()} />

        {/* Textarea — siempre activo */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          className="w-full h-56 bg-transparent resize-none px-5 py-4 text-sm font-mono text-text/90 focus:outline-none leading-relaxed relative z-10 placeholder-transparent"
          spellCheck={false}
        />

        {/* Watermark overlay — puntero pass-through */}
        {showOverlay && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none select-none">
            <span className="text-5xl font-mono text-muted/15 tracking-widest">&gt;_</span>
            <div className="text-center space-y-1">
              <p className="text-sm text-muted/50">Pega logs, arrastra un archivo, o escribe aquí</p>
              <p className="text-xs text-muted/30">Soporta .log, .txt, .json o texto libre</p>
            </div>
          </div>
        )}

        {/* Drag active overlay */}
        {isDragActive && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 pointer-events-none border-2 border-accent drag-active">
            <Upload className="w-10 h-10 text-accent animate-bounce" />
            <p className="text-sm font-semibold text-accent">Suelta el archivo aquí</p>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0d0d1a] border-t border-border gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted/50 shrink-0">
          <Shield className="w-3.5 h-3.5 text-success/60 shrink-0" />
          <span>Privacidad garantizada. No usamos tus logs para entrenar modelos.</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={onExample}
            disabled={disabled}
            className="text-sm text-muted hover:text-text transition-colors px-4 py-2 rounded-lg hover:bg-white/5 border border-border/50 whitespace-nowrap"
          >
            Probar ejemplo
          </button>
          <button
            type="button"
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
