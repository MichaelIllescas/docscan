import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DEFAULT_EXPORT_OPTIONS,
  formatFileSize,
  type ExportOptions,
  type ExportQuality,
  type PaperSize,
} from '../../domain/export'
import { documentRepository } from '../../infrastructure/db'
import { exportJpgs, exportPdf } from '../../infrastructure/pdf/exportDocument'
import { canShareFiles, downloadFile, shareFiles } from '../../shared/shareFiles'

const PAPER_OPTIONS: { value: PaperSize; label: string }[] = [
  { value: 'a4', label: 'A4' },
  { value: 'letter', label: 'Carta' },
  { value: 'fit', label: 'Ajustado' },
]

const QUALITY_OPTIONS: { value: ExportQuality; label: string }[] = [
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Media' },
  { value: 'low', label: 'Baja' },
]

const OPTIONS_STORAGE_KEY = 'docscan.exportOptions'

function loadOptions(): ExportOptions {
  try {
    const saved = localStorage.getItem(OPTIONS_STORAGE_KEY)
    return saved ? { ...DEFAULT_EXPORT_OPTIONS, ...JSON.parse(saved) } : DEFAULT_EXPORT_OPTIONS
  } catch {
    return DEFAULT_EXPORT_OPTIONS
  }
}

export function ExportPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const doc = useLiveQuery(() => documentRepository.getById(id), [id], null)
  const pages = useLiveQuery(() => documentRepository.getPages(id), [id])
  const [options, setOptions] = useState<ExportOptions>(loadOptions)
  const [pdf, setPdf] = useState<File | null>(null)
  const [progress, setProgress] = useState('')
  const [message, setMessage] = useState('')

  const docName = doc?.name ?? ''

  // El PDF se genera de antemano para poder compartirlo directo en el clic (Web Share lo exige).
  useEffect(() => {
    if (!pages?.length || !docName) return
    let cancelled = false
    setPdf(null)
    setMessage('')
    try {
      localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(options))
    } catch {
      /* sin almacenamiento: no se recuerdan las opciones */
    }
    exportPdf(
      docName,
      pages.map((p) => p.processedBlob),
      options,
      (done, total) => !cancelled && setProgress(`Preparando ${done}/${total}…`),
    )
      .then((file) => !cancelled && setPdf(file))
      .catch(() => !cancelled && setMessage('No se pudo generar el PDF.'))
      .finally(() => !cancelled && setProgress(''))
    return () => {
      cancelled = true
    }
  }, [pages, docName, options])

  if (doc === null || !pages) return null
  if (!doc) {
    navigate('/', { replace: true })
    return null
  }

  async function handleSharePdf() {
    if (!pdf) return
    if (!canShareFiles([pdf])) return downloadFile(pdf)
    try {
      await shareFiles([pdf], doc!.name)
    } catch {
      downloadFile(pdf)
    }
  }

  async function handleJpgs(mode: 'share' | 'download') {
    setProgress('Preparando imágenes…')
    try {
      const files = await exportJpgs(doc!.name, pages!.map((p) => p.processedBlob), options)
      if (mode === 'share' && canShareFiles(files)) {
        await shareFiles(files, doc!.name).catch(() => files.forEach(downloadFile))
      } else {
        files.forEach(downloadFile)
      }
    } finally {
      setProgress('')
    }
  }

  const shareSupported = pdf ? canShareFiles([pdf]) : false

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center gap-2 bg-blue-600 px-2 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 text-white">
        <button onClick={() => navigate(-1)} aria-label="Volver" className="rounded-lg px-3 py-2 text-xl">
          ←
        </button>
        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">Exportar</h1>
      </header>

      <main className="flex-1 space-y-6 p-4">
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <p className="truncate font-medium">{doc.name}.pdf</p>
          <p className="mt-1 text-sm text-slate-500">
            {pages.length} {pages.length === 1 ? 'página' : 'páginas'} ·{' '}
            {pdf ? formatFileSize(pdf.size) : progress || 'Calculando…'}
          </p>
        </section>

        <OptionGroup label="Tamaño de hoja" options={PAPER_OPTIONS} value={options.paper} onChange={(paper) => setOptions({ ...options, paper })} />
        <OptionGroup
          label="Calidad"
          hint="Menor calidad = archivo más liviano"
          options={QUALITY_OPTIONS}
          value={options.quality}
          onChange={(quality) => setOptions({ ...options, quality })}
        />

        {message && <p className="text-sm text-red-600">{message}</p>}

        <div className="space-y-2">
          {shareSupported && (
            <button
              onClick={handleSharePdf}
              disabled={!pdf}
              className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white active:bg-blue-700 disabled:opacity-50"
            >
              Compartir PDF
            </button>
          )}
          <button
            onClick={() => pdf && downloadFile(pdf)}
            disabled={!pdf}
            className={`w-full rounded-lg py-3 font-semibold disabled:opacity-50 ${
              shareSupported ? 'bg-white text-blue-600 shadow-sm active:bg-slate-100' : 'bg-blue-600 text-white active:bg-blue-700'
            }`}
          >
            Descargar PDF
          </button>
        </div>

        <section className="border-t border-slate-200 pt-4">
          <p className="mb-2 text-sm text-slate-500">Páginas como imágenes (JPG)</p>
          <div className="flex gap-2">
            {shareSupported && (
              <button onClick={() => handleJpgs('share')} disabled={!!progress} className="flex-1 rounded-lg bg-white py-2.5 text-sm font-medium shadow-sm active:bg-slate-100 disabled:opacity-50">
                Compartir JPG
              </button>
            )}
            <button onClick={() => handleJpgs('download')} disabled={!!progress} className="flex-1 rounded-lg bg-white py-2.5 text-sm font-medium shadow-sm active:bg-slate-100 disabled:opacity-50">
              Descargar JPG
            </button>
          </div>
        </section>
      </main>
    </>
  )
}

interface OptionGroupProps<T extends string> {
  label: string
  hint?: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

function OptionGroup<T extends string>({ label, hint, options, value, onChange }: OptionGroupProps<T>) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-slate-700">{label}</legend>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      <div className="mt-2 grid grid-cols-3 gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-lg py-2.5 text-sm font-medium ${
              value === o.value ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 shadow-sm active:bg-slate-100'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
