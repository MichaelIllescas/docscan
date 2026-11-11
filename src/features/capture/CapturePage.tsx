import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { CapturedImage, ProcessedCapture } from '../../domain/page'
import { documentRepository } from '../../infrastructure/db'
import { processCapture } from '../../infrastructure/vision/processCapture'
import { warmUpVision } from '../../infrastructure/vision/visionClient'
import { captureVideoFrame, createThumbnail, normalizeImageFile } from '../../shared/image'
import { useObjectUrl } from '../../shared/useObjectUrl'
import { useCamera } from './useCamera'

const STATUS_MESSAGES = {
  denied: 'No hay permiso para usar la cámara. Habilitalo en los ajustes del navegador o importá fotos de la galería.',
  unavailable: 'No se encontró una cámara disponible. Podés importar fotos de la galería.',
} as const

export function CapturePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const targetDocId = params.get('doc')
  const { videoRef, status, torchSupported, torchOn, toggleTorch } = useCamera()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [captured, setCaptured] = useState<CapturedImage[]>([])
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState(false)
  const [progress, setProgress] = useState('')

  useEffect(() => warmUpVision(), [])
  const lastPreview = useObjectUrl(captured[captured.length - 1]?.blob)

  async function handleShutter() {
    const video = videoRef.current
    if (!video || status !== 'ready' || busy) return
    setFlash(true)
    setTimeout(() => setFlash(false), 120)
    const image = await captureVideoFrame(video)
    setCaptured((prev) => [...prev, image])
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setBusy(true)
    try {
      const images: CapturedImage[] = []
      for (const file of Array.from(files)) images.push(await normalizeImageFile(file))
      setCaptured((prev) => [...prev, ...images])
    } finally {
      setBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDone() {
    if (!captured.length || busy) return
    setBusy(true)
    try {
      const processed: ProcessedCapture[] = []
      for (const [index, image] of captured.entries()) {
        setProgress(`Procesando ${index + 1}/${captured.length}`)
        processed.push(await processCapture(image))
      }
      const docId = targetDocId ?? (await documentRepository.create()).id
      const thumbnail = await createThumbnail(processed[0].processed)
      await documentRepository.addPages(docId, processed, thumbnail)
      navigate(`/doc/${docId}`, { replace: true })
    } finally {
      setBusy(false)
      setProgress('')
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-black text-white">
      <div className="flex items-center justify-between px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3">
        <button onClick={() => navigate(-1)} className="rounded-lg px-2 py-1 text-lg">
          ✕
        </button>
        {torchSupported && (
          <button onClick={toggleTorch} className={`rounded-full px-3 py-1 text-sm ${torchOn ? 'bg-yellow-400 text-black' : 'bg-white/15'}`}>
            Flash {torchOn ? 'ON' : 'OFF'}
          </button>
        )}
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} playsInline muted className="h-full w-full object-contain" />
        {status === 'starting' && <p className="absolute inset-0 flex items-center justify-center text-white/70">Iniciando cámara…</p>}
        {(status === 'denied' || status === 'unavailable') && (
          <p className="absolute inset-0 flex items-center justify-center p-8 text-center text-white/80">{STATUS_MESSAGES[status]}</p>
        )}
        {flash && <div className="absolute inset-0 bg-white/70" />}
      </div>

      <div className="grid grid-cols-3 items-center px-6 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="justify-self-start rounded-lg bg-white/15 px-3 py-2 text-sm"
        >
          Galería
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />

        <button
          onClick={handleShutter}
          disabled={status !== 'ready' || busy}
          aria-label="Tomar foto"
          className="h-18 w-18 justify-self-center rounded-full border-4 border-white bg-white/90 transition-transform active:scale-90 disabled:opacity-30"
        />

        <button
          onClick={handleDone}
          disabled={!captured.length || busy}
          className="relative justify-self-end disabled:opacity-40"
          aria-label={`Listo, ${captured.length} páginas`}
        >
          {lastPreview ? (
            <img src={lastPreview} alt="" className="h-14 w-11 rounded border-2 border-white object-cover" />
          ) : (
            <span className="block h-14 w-11 rounded border-2 border-white/40" />
          )}
          {captured.length > 0 && (
            <span className="absolute -top-2 -right-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-bold">
              {captured.length}
            </span>
          )}
          <span className="mt-1 block text-xs">{progress || (busy ? 'Cargando…' : 'Listo')}</span>
        </button>
      </div>
    </div>
  )
}
