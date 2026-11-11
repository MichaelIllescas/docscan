import { Contrast, Crop, RotateCcw, RotateCw, Sun, Undo2, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DEFAULT_ADJUSTMENTS, rotate, type PageAdjustments } from '../../domain/adjustments'
import type { Page, PageFilter } from '../../domain/page'
import { documentRepository } from '../../infrastructure/db'
import { createThumbnail } from '../../shared/image'
import { renderAdjusted, renderToCanvas } from '../../shared/renderPage'
import { EditorHeader, ToolButton } from '../../shared/ui/EditorChrome'

const PREVIEW_MAX_SIDE = 1000
const FILTER_THUMB_SIDE = 140

const FILTERS: { value: PageFilter; label: string }[] = [
  { value: 'original', label: 'Original' },
  { value: 'enhanced', label: 'Mejorado' },
  { value: 'grayscale', label: 'Grises' },
  { value: 'bw', label: 'B/N' },
]

type Tab = 'filters' | 'adjust'

const pickAdjustments = (p: Page): PageAdjustments => ({
  rotation: p.rotation,
  filter: p.filter,
  brightness: p.brightness,
  contrast: p.contrast,
})

export function PageEditorPage() {
  const { id = '', pageId = '' } = useParams()
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [page, setPage] = useState<Page | null>(null)
  const [source, setSource] = useState<ImageBitmap | null>(null)
  const [adj, setAdj] = useState<PageAdjustments>(DEFAULT_ADJUSTMENTS)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<Tab>('filters')

  useEffect(() => {
    let bitmap: ImageBitmap | null = null
    let cancelled = false
    documentRepository.getPage(pageId).then(async (p) => {
      if (!p) return navigate(`/doc/${id}`, { replace: true })
      bitmap = await createImageBitmap(p.croppedBlob ?? p.processedBlob)
      if (cancelled) return bitmap.close()
      setPage(p)
      setAdj(pickAdjustments(p))
      setSource(bitmap)
    })
    return () => {
      cancelled = true
      bitmap?.close()
    }
  }, [id, pageId, navigate])

  useEffect(() => {
    if (!source || !canvasRef.current) return
    const frame = requestAnimationFrame(() => renderToCanvas(source, adj, canvasRef.current!, PREVIEW_MAX_SIDE))
    return () => cancelAnimationFrame(frame)
  }, [source, adj])

  const update = (changes: Partial<PageAdjustments>) => setAdj((prev) => ({ ...prev, ...changes }))

  async function handleSave() {
    if (!page) return
    setSaving(true)
    try {
      const processed = await renderAdjusted(page.croppedBlob ?? page.processedBlob, adj)
      const thumbnail = await createThumbnail(processed)
      await documentRepository.updatePage(
        page.id,
        { ...adj, croppedBlob: page.croppedBlob ?? page.processedBlob, processedBlob: processed },
        thumbnail,
      )
      navigate(`/doc/${id}`, { replace: true })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-950 text-white">
      <EditorHeader title="Editar página" onCancel={() => navigate(-1)} onSave={handleSave} saving={saving} saveDisabled={!page} />

      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <canvas ref={canvasRef} className="max-h-full max-w-full rounded-sm bg-white object-contain shadow-2xl shadow-black/60" />
      </div>

      <div className="rounded-t-3xl bg-slate-900 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-3 flex w-fit rounded-full bg-white/5 p-1 text-sm font-medium">
          {(
            [
              ['filters', 'Filtros'],
              ['adjust', 'Ajustes'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              aria-pressed={tab === value}
              className={`rounded-full px-5 py-1.5 transition-colors ${tab === value ? 'bg-white text-slate-900' : 'text-white/60'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="h-[132px] px-4">
          {tab === 'filters' ? (
            <div className="flex justify-center gap-3">
              {FILTERS.map((f) => (
                <FilterThumb
                  key={f.value}
                  source={source}
                  filter={f.value}
                  rotation={adj.rotation}
                  label={f.label}
                  selected={adj.filter === f.value}
                  onSelect={() => update({ filter: f.value })}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <Slider icon={Sun} label="Brillo" value={adj.brightness} onChange={(brightness) => update({ brightness })} />
              <Slider icon={Contrast} label="Contraste" value={adj.contrast} onChange={(contrast) => update({ contrast })} />
            </div>
          )}
        </div>

        <div className="mt-1 flex justify-center gap-2 border-t border-white/5 px-2 pt-2">
          <ToolButton icon={RotateCcw} label="Rotar izq." onClick={() => update({ rotation: rotate(adj.rotation, 'left') })} />
          <ToolButton icon={RotateCw} label="Rotar der." onClick={() => update({ rotation: rotate(adj.rotation, 'right') })} />
          <ToolButton icon={Crop} label="Recortar" onClick={() => navigate(`/doc/${id}/page/${pageId}/crop`, { replace: true })} />
          <ToolButton icon={Undo2} label="Restablecer" onClick={() => setAdj(DEFAULT_ADJUSTMENTS)} />
        </div>
      </div>
    </div>
  )
}

interface FilterThumbProps {
  source: ImageBitmap | null
  filter: PageFilter
  rotation: PageAdjustments['rotation']
  label: string
  selected: boolean
  onSelect: () => void
}

/** Miniatura con la vista previa real del filtro. */
function FilterThumb({ source, filter, rotation, label, selected, onSelect }: FilterThumbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!source || !canvasRef.current) return
    renderToCanvas(source, { filter, rotation, brightness: 0, contrast: 0 }, canvasRef.current, FILTER_THUMB_SIDE)
  }, [source, filter, rotation])

  return (
    <button onClick={onSelect} aria-pressed={selected} className="flex w-[72px] flex-col items-center gap-1.5">
      <span
        className={`flex h-24 w-[72px] items-center justify-center overflow-hidden rounded-xl bg-white/5 transition-shadow ${
          selected ? 'ring-[3px] ring-sky-400' : 'ring-1 ring-white/10'
        }`}
      >
        <canvas ref={canvasRef} className="max-h-full max-w-full object-contain" />
      </span>
      <span className={`text-xs font-medium ${selected ? 'text-sky-300' : 'text-white/70'}`}>{label}</span>
    </button>
  )
}

interface SliderProps {
  icon: LucideIcon
  label: string
  value: number
  onChange: (v: number) => void
}

function Slider({ icon: Icon, label, value, onChange }: SliderProps) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <Icon size={18} className="shrink-0 text-white/60" aria-hidden />
      <span className="w-20 text-white/80">{label}</span>
      <input
        type="range"
        min={-100}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onDoubleClick={() => onChange(0)}
        className="flex-1 accent-sky-400"
      />
      <span className="w-9 text-right text-white/60 tabular-nums">{value > 0 ? `+${value}` : value}</span>
    </label>
  )
}
