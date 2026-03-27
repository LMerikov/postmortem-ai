import { useCallback } from 'react'
import PropTypes from 'prop-types'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText } from 'lucide-react'

export function LogInput({ value, onChange, disabled }) {
  const onDrop = useCallback((files) => {
    const file = files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => onChange(e.target.result)
    reader.readAsText(file)
  }, [onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/*': ['.log', '.txt', '.json'] },
    maxFiles: 1,
    disabled,
    noClick: true,
  })

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-xl transition-all duration-300 ${
        isDragActive
          ? 'border-accent drag-active bg-accent/5'
          : 'border-border hover:border-accent/50 bg-input'
      }`}
    >
      <input {...getInputProps()} />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Pega tus logs de servidor, stacktraces, o describe el incidente...&#10;&#10;O arrastra y suelta un archivo .log / .txt / .json aquí"
        className="w-full h-64 bg-transparent resize-none p-4 text-sm font-mono text-text placeholder-muted focus:outline-none"
        spellCheck={false}
      />
      {isDragActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
          <Upload className="w-10 h-10 text-accent" />
          <p className="text-accent font-semibold">Suelta tu archivo de logs aquí</p>
        </div>
      )}
      {!value && !isDragActive && (
        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 text-muted/50 pointer-events-none">
          <FileText className="w-4 h-4" />
          <span className="text-xs">.log .txt .json</span>
        </div>
      )}
    </div>
  )
}

LogInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
}

LogInput.defaultProps = {
  disabled: false,
}
