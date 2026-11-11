import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DEFAULT_ADJUSTMENTS, rotate, type PageAdjustments } from '../../domain/adjustments'
import type { Page, PageFilter } from '../../domain/page'
import { documentRepository } from '../../infrastructure/db'
import { createThumbnail } from '../../shared/image'
import { renderAdjusted, renderToCanvas } from '../../shared/renderPage'

const PREVIEW_MAX_SIDE = 1000

const FILTERS: { value: PageFilter; label: string }[] = [
  { value: 'original', label: 'Original' },
  { value: 'enhanced', label: 'Mejorado' },
  { value: 'grayscale', label: 'Grises' },
  { value: 'bw', label: 'B/N' },
]

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
    <div className="fixed inset-0 flex flex-col bg-neutral-900 text-white">
      <header className="flex items-center justify-between px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3">
        <button onClick={() => navigate(-1)} className="px-2 py-1">
          Cancelar
        </button>
        <h1 className="font-semibold">Editar página</h1>
        <button onClick={handleSave} disabled={!page || saving} className="px-2 py-1 font-semibold text-blue-400 disabled:opacity-40">
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </header>

      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <canvas ref={canvasRef} className="max-h-full max-w-full bg-white object-contain shadow-lg" />
      </div>

      <div className="space-y-4 px-4 pt-2 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <div className="flex justify-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => update({ filter: f.value })}
              aria-pressed={adj.filter === f.value}
              className={`rounded-full px-3 py-1.5 text-sm ${adj.filter === f.value ? 'bg-blue-600 font-semibold' : 'bg-white/15'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Slider label="Brillo" value={adj.brightness} onChange={(brightness) => update({ brightness })} />
        <Slider label="Contraste" value={adj.contrast} onChange={(contrast) => update({ contrast })} />

        <div className="flex justify-center gap-2 text-sm">
          <button onClick={() => update({ rotation: rotate(adj.rotation, 'left') })} className="rounded-lg bg-white/15 px-3 py-2" aria-label="Rotar a la izquierda">
            ⟲ Rotar
          </button>
          <button onClick={() => update({ rotation: rotate(adj.rotation, 'right') })} className="rounded-lg bg-white/15 px-3 py-2" aria-label="Rotar a la derecha">
            Rotar ⟳
          </button>
          <Link to={`/doc/${id}/page/${pageId}/crop`} replace className="rounded-lg bg-white/15 px-3 py-2">
            Recortar
          </Link>
          <button onClick={() => setAdj(DEFAULT_ADJUSTMENTS)} className="rounded-lg bg-white/15 px-3 py-2">
            Restablecer
          </button>
        </div>
      </div>
    </div>
  )
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <span className="w-20 text-white/80">{label}</span>
      <input
        type="range"
        min={-100}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onDoubleClick={() => onChange(0)}
        className="flex-1 accent-blue-500"
      />
      <span className="w-8 text-right tabular-nums text-white/60">{value}</span>
    </label>
  )
}
