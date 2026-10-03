import { useCallback, useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'
import { ArrowRight, ShieldCheck, FileText, FolderOpen, AlertCircle, Upload, X } from 'lucide-react'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export function LogInput({ value, onChange, disabled = false, onAnalyze, onExample, error: externalError = '' }) {
  const { t, i18n } = useTranslation()
  const [fileName, setFileName] = useState('')
  const [fileError, setFileError] = useState('')
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const error = fileError || externalError

  const handleFileRead = useCallback(async (file) => {
    if (file.size > MAX_FILE_SIZE) {
      setFileError(t('input.tooLarge', {
        size: (file.size / 1024 / 1024).toFixed(1),
        max: (MAX_FILE_SIZE / 1024 / 1024).toFixed(0),
      }))
      return
    }
    try {
      onChange(await file.text())
      setFileName(file.name)
      setFileError('')
      setTimeout(() => textareaRef.current?.focus(), 0)
    } catch (err) {
      setFileError(t('input.readError', { message: err.message }))
    }
  }, [onChange, t])

  const onDrop = useCallback(async (files) => {
    if (files[0]) await handleFileRead(files[0])
  }, [handleFileRead])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/*': ['.log', '.txt', '.json'] },
    maxFiles: 1,
    disabled,
    noClick: true,
    noKeyboard: true,
  })

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (file) await handleFileRead(file)
    e.target.value = ''
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      onAnalyze()
    }
  }

  const clear = () => {
    onChange('')
    setFileName('')
    setFileError('')
    textareaRef.current?.focus()
  }

  const hasValue = Boolean(value?.trim())

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-input shadow-[0_24px_48px_-24px_rgba(0,0,0,0.7)]">

      <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-2.5">
        <label htmlFor="log-input" className="text-sm font-medium text-text">
          {t('input.label')}
        </label>
        <div className="flex min-w-0 items-center gap-1">
          {fileName && (
            <span className="flex min-w-0 items-center gap-1.5 rounded-md border border-border bg-input px-2.5 py-1 font-mono text-xs text-text/80">
              <FileText className="h-3.5 w-3.5 shrink-0 text-accent-strong" aria-hidden="true" />
              <span className="truncate">{fileName}</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="btn-ghost py-1.5 text-xs"
          >
            <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{t('input.openFile')}</span>
          </button>
          {hasValue && (
            <button type="button" onClick={clear} disabled={disabled} className="btn-ghost py-1.5 text-xs">
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{t('input.clear')}</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".log,.txt,.json,text/*"
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
            tabIndex={-1}
          />
        </div>
      </div>

      {error && (
        <div id="log-input-error" role="alert" className="flex items-center gap-2 border-b border-p0/20 bg-p0/10 px-4 py-2.5 text-sm text-p0">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div {...getRootProps()} className={`relative ${isDragActive ? 'drag-active bg-accent/5' : ''}`}>
        <input {...getInputProps()} />
        <textarea
          id="log-input"
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={t('input.placeholder')}
          aria-describedby={`log-input-hint${error ? ' log-input-error' : ''}`}
          aria-invalid={Boolean(error) || undefined}
          className="block h-56 w-full resize-y bg-transparent px-5 py-4 font-mono text-[13px] leading-relaxed text-text/90 placeholder:font-sans placeholder:text-sm placeholder:text-muted/70 focus:outline-none focus-visible:outline-none"
          spellCheck={false}
        />
        {isDragActive && (
          <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-input/90">
            <Upload className="h-8 w-8 text-accent-strong" aria-hidden="true" />
            <p className="text-sm font-medium text-accent-strong">{t('input.dropHere')}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div id="log-input-hint" className="space-y-0.5 text-xs text-muted">
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
            {t('input.privacy')}
          </p>
          <p className="pl-5">
            {hasValue
              ? <span className="tabular">{t('input.chars', { n: value.length.toLocaleString(i18n.language) })}</span>
              : t('input.formats')}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={onExample} disabled={disabled} className="btn-secondary text-sm">
            {t('input.example')}
          </button>
          <button
            type="button"
            onClick={onAnalyze}
            disabled={disabled || !hasValue}
            className="btn-primary flex-1 text-sm sm:flex-none"
          >
            {t('input.generate')}
            <kbd className="kbd hidden sm:inline" aria-hidden="true">{t('input.shortcut', { key: IS_MAC ? '⌘' : 'Ctrl' })}</kbd>
            <ArrowRight className="h-4 w-4 sm:hidden" aria-hidden="true" />
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
  error: PropTypes.string,
}
