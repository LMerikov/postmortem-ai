import { useCallback, useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, FileText, AlertCircle, Upload } from 'lucide-react'

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

  const submit = () => {
    if (!hasValue) textareaRef.current?.focus()
    onAnalyze()
  }

  // The textarea draws no ring of its own: the whole frame takes the focus indicator.
  return (
    <div className="border border-line/70 bg-input focus-within:border-text focus-within:outline focus-within:outline-2 focus-within:outline-offset-[3px] focus-within:outline-text">

      <div className="flex flex-wrap items-stretch justify-between border-b border-border">
        <label htmlFor="log-input" className="caps-lg flex w-full items-center px-4 py-3 text-text sm:w-auto">
          {t('input.label')}
        </label>
        <div className="flex w-full min-w-0 items-stretch border-t border-border sm:w-auto sm:border-t-0">
          {fileName && (
            <span className="flex min-w-0 items-center gap-2 border-l border-border px-3 font-mono text-xs text-muted">
              <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{fileName}</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex-1 border-l border-border px-4 py-3 caps text-muted transition-colors first:border-l-0 hover:bg-subtle hover:text-text disabled:opacity-50 sm:flex-none sm:py-0 sm:first:border-l"
          >
            {t('input.openFile')}
          </button>
          {hasValue && (
            <button
              type="button"
              onClick={clear}
              disabled={disabled}
              className="flex-1 border-l border-border px-4 py-3 caps text-muted transition-colors first:border-l-0 hover:bg-subtle hover:text-text disabled:opacity-50 sm:flex-none sm:py-0 sm:first:border-l"
            >
              {t('input.clear')}
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
        <div id="log-input-error" role="alert" className="flex items-center gap-3 border-b border-border bg-fac-red px-4 py-2.5 text-sm text-white">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div {...getRootProps()} className={`relative ${isDragActive ? 'drag-active bg-subtle' : ''}`}>
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
          className="block h-56 w-full resize-y bg-transparent px-5 py-4 font-mono text-[13px] leading-relaxed text-text placeholder:font-sans placeholder:text-sm placeholder:text-muted focus:outline-none focus-visible:outline-none"
          spellCheck={false}
        />
        {isDragActive && (
          <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-bg/90">
            <Upload className="h-8 w-8" aria-hidden="true" />
            <p className="caps-lg">{t('input.dropHere')}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div id="log-input-hint" className="space-y-1 text-[13px] text-muted">
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-text" aria-hidden="true" />
            {t('input.privacy')}
          </p>
          <p className="pl-[22px]">
            {hasValue
              ? <span className="tabular">{t('input.chars', { n: value.length.toLocaleString(i18n.language) })}</span>
              : t('input.formats')}
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col-reverse gap-3 sm:w-auto sm:flex-row sm:items-center">
          {!hasValue && (
            <button type="button" onClick={onExample} disabled={disabled} className="btn-secondary w-full sm:w-auto">
              {t('input.example')}
            </button>
          )}
          <button type="button" onClick={submit} disabled={disabled} className="btn-primary w-full sm:w-auto">
            {t('input.generate')}
            <kbd className="kbd hidden font-sans normal-case sm:inline" aria-hidden="true">{t('input.shortcut', { key: IS_MAC ? '⌘' : 'Ctrl' })}</kbd>
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
