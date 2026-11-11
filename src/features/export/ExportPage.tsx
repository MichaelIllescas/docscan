import { useLiveQuery } from 'dexie-react-hooks'
import { Download, FileText, Image as ImageIcon, Loader2, RectangleVertical, Scaling, Share2, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatFileSize, type ExportOptions, type ExportQuality, type PaperSize } from '../../domain/export'
import { documentRepository } from '../../infrastructure/db'
import { exportJpgs, exportPdf } from '../../infrastructure/pdf/exportDocument'
import { canShareFiles, downloadFile, shareFiles } from '../../shared/shareFiles'
import { AppHeader } from '../../shared/ui/AppHeader'
import { loadExportOptions, saveExportOptions } from './exportOptionsStore'

const PAPER_OPTIONS: { value: PaperSize; label: string; hint: string; icon: LucideIcon }[] = [
  { value: 'fit', label: 'Ajustado', hint: 'Sin bordes', icon: Scaling },
  { value: 'a4', label: 'A4', hint: '21 × 29,7 cm', icon: RectangleVertical },
  { value: 'letter', label: 'Carta', hint: '21,6 × 27,9 cm', icon: RectangleVertical },
]

const QUALITY_OPTIONS: { value: ExportQuality; label: string; hint: string }[] = [
  { value: 'high', label: 'Alta', hint: 'Más nítido' },
  { value: 'medium', label: 'Media', hint: 'Equilibrado' },
  { value: 'low', label: 'Baja', hint: 'Más liviano' },
]

export function ExportPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const doc = useLiveQuery(() => documentRepository.getById(id), [id], null)
  const pages = useLiveQuery(() => documentRepository.getPages(id), [id])
  const [options, setOptions] = useState<ExportOptions>(loadExportOptions)
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
    saveExportOptions(options)
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
  const busy = !pdf && !message

  return (
    <>
      <AppHeader onBack={() => navigate(-1)}>
        <h1 className="text-lg font-semibold text-slate-900">Exportar</h1>
      </AppHeader>

      <main className="flex-1 space-y-6 px-4 pt-4 pb-44">
        <section className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-brand-700 to-sky-500 p-4 text-white shadow-float">
          <span className="flex h-14 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
            <FileText size={26} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{doc.name}.pdf</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-white/80">
              {pages.length} {pages.length === 1 ? 'página' : 'páginas'} ·
              {pdf ? (
                <span className="font-semibold text-white">{formatFileSize(pdf.size)}</span>
              ) : (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {progress || 'Calculando…'}
                </>
              )}
            </p>
          </div>
        </section>

        <OptionGroup
          label="Tamaño de hoja"
          options={PAPER_OPTIONS}
          value={options.paper}
          onChange={(paper) => setOptions({ ...options, paper })}
        />
        <OptionGroup
          label="Calidad"
          options={QUALITY_OPTIONS}
          value={options.quality}
          onChange={(quality) => setOptions({ ...options, quality })}
        />

        {message && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>}

        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Páginas como imágenes</h2>
          <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <ImageIcon size={20} />
            </span>
            <p className="min-w-0 flex-1 text-sm text-slate-600">Un JPG por página</p>
            {shareSupported && (
              <button
                onClick={() => handleJpgs('share')}
                disabled={!!progress}
                aria-label="Compartir JPG"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 active:bg-slate-200 disabled:opacity-40"
              >
                <Share2 size={18} />
              </button>
            )}
            <button
              onClick={() => handleJpgs('download')}
              disabled={!!progress}
              aria-label="Descargar JPG"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 active:bg-slate-200 disabled:opacity-40"
            >
              <Download size={18} />
            </button>
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/70 bg-white/90 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl">
        <div className="mx-auto flex max-w-md flex-col gap-2">
          {shareSupported && (
            <button
              onClick={handleSharePdf}
              disabled={!pdf}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-brand-600 to-sky-500 py-3.5 font-semibold text-white shadow-float active:scale-[0.98] disabled:opacity-50"
            >
              <Share2 size={20} />
              Compartir PDF
            </button>
          )}
          <button
            onClick={() => pdf && downloadFile(pdf)}
            disabled={!pdf}
            className={`flex items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold disabled:opacity-50 ${
              shareSupported
                ? 'bg-slate-100 text-slate-700 active:bg-slate-200'
                : 'bg-gradient-to-br from-brand-600 to-sky-500 text-white shadow-float active:scale-[0.98]'
            }`}
          >
            {busy ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
            Descargar PDF
          </button>
        </div>
      </div>
    </>
  )
}

interface OptionGroupProps<T extends string> {
  label: string
  options: { value: T; label: string; hint: string; icon?: LucideIcon }[]
  value: T
  onChange: (value: T) => void
}

function OptionGroup<T extends string>({ label, options, value, onChange }: OptionGroupProps<T>) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-slate-700">{label}</legend>
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => {
          const selected = value === o.value
          const Icon = o.icon
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(o.value)}
              className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-center transition-colors ${
                selected ? 'bg-brand-50 text-brand-700 ring-2 ring-brand-500' : 'bg-white text-slate-700 shadow-card active:bg-slate-50'
              }`}
            >
              {Icon && <Icon size={20} className={selected ? 'text-brand-600' : 'text-slate-400'} />}
              <span className="text-sm font-semibold">{o.label}</span>
              <span className={`text-[11px] ${selected ? 'text-brand-600/80' : 'text-slate-400'}`}>{o.hint}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
