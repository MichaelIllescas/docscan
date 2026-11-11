import { CameraOff, Check, Images, Loader2, X, Zap, ZapOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { CapturedImage, ProcessedCapture } from '../../domain/page'
import { documentRepository } from '../../infrastructure/db'
import { processCapture } from '../../infrastructure/vision/processCapture'
import { warmUpVision } from '../../infrastructure/vision/visionClient'
import { captureVideoFrame, createThumbnail, normalizeImageFile } from '../../shared/image'
import { requestPersistentStorage } from '../../shared/storage'
import { useObjectUrl } from '../../shared/useObjectUrl'
import { useCamera } from './useCamera'

const STATUS_MESSAGES = {
  denied: {
    title: 'Sin acceso a la cámara',
    body: 'Habilitá el permiso en los ajustes del navegador, o importá fotos desde la galería.',
  },
  unavailable: {
    title: 'No hay cámara disponible',
    body: 'Podés importar fotos desde la galería.',
  },
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
        setProgress(`Procesando ${index + 1} de ${captured.length}`)
        processed.push(await processCapture(image))
      }
      const docId = targetDocId ?? (await documentRepository.create()).id
      const thumbnail = await createThumbnail(processed[0].processed)
      await documentRepository.addPages(docId, processed, thumbnail)
      void requestPersistentStorage()
      navigate(`/doc/${docId}`, { replace: true })
    } finally {
      setBusy(false)
      setProgress('')
    }
  }

  const statusMessage = status === 'denied' || status === 'unavailable' ? STATUS_MESSAGES[status] : null

  return (
    <div className="fixed inset-0 flex flex-col bg-black text-white">
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-6">
        <button
          onClick={() => navigate(-1)}
          aria-label="Cerrar cámara"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur active:bg-black/60"
        >
          <X size={22} />
        </button>
        {captured.length > 0 && (
          <span className="rounded-full bg-black/40 px-3 py-1 text-sm font-medium backdrop-blur">
            {captured.length} {captured.length === 1 ? 'página' : 'páginas'}
          </span>
        )}
        {torchSupported ? (
          <button
            onClick={toggleTorch}
            aria-label={torchOn ? 'Apagar flash' : 'Encender flash'}
            aria-pressed={torchOn}
            className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur ${
              torchOn ? 'bg-amber-400 text-black' : 'bg-black/40 active:bg-black/60'
            }`}
          >
            {torchOn ? <Zap size={20} /> : <ZapOff size={20} />}
          </button>
        ) : (
          <span className="w-10" />
        )}
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />

        {status === 'ready' && <ViewfinderFrame />}

        {status === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm">Iniciando cámara…</p>
          </div>
        )}

        {statusMessage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
              <CameraOff size={30} className="text-white/80" />
            </span>
            <p className="mt-4 font-semibold">{statusMessage.title}</p>
            <p className="mt-1 text-sm text-white/60">{statusMessage.body}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-slate-900 active:bg-white/90"
            >
              <Images size={20} />
              Elegir de la galería
            </button>
          </div>
        )}

        {flash && <div className="absolute inset-0 bg-white/70" />}

        {progress && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/70 backdrop-blur-sm">
            <Loader2 size={32} className="animate-spin text-sky-300" />
            <p className="font-medium">{progress}</p>
            <p className="text-sm text-white/60">Detectando bordes y enderezando</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 items-center bg-black px-6 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          aria-label="Importar de la galería"
          className="flex h-12 w-12 items-center justify-center justify-self-start rounded-2xl bg-white/12 active:bg-white/20 disabled:opacity-40"
        >
          <Images size={22} />
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleFiles(e.target.files)} />

        <button
          onClick={handleShutter}
          disabled={status !== 'ready' || busy}
          aria-label="Tomar foto"
          className="flex h-[76px] w-[76px] items-center justify-center justify-self-center rounded-full border-4 border-white/90 transition-transform active:scale-90 disabled:opacity-30"
        >
          <span className="h-[60px] w-[60px] rounded-full bg-white" />
        </button>

        <button
          onClick={handleDone}
          disabled={!captured.length || busy}
          aria-label={`Listo, ${captured.length} páginas`}
          className="relative justify-self-end disabled:opacity-40"
        >
          {lastPreview ? (
            <span className="relative block">
              <img src={lastPreview} alt="" className="h-14 w-11 rounded-lg object-cover ring-2 ring-white" />
              <span className="absolute -right-2 -bottom-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 ring-2 ring-black">
                <Check size={16} strokeWidth={3} />
              </span>
            </span>
          ) : (
            <span className="block h-14 w-11 rounded-lg border-2 border-dashed border-white/30" />
          )}
        </button>
      </div>
    </div>
  )
}

/** Guías de encuadre en las esquinas del visor. */
function ViewfinderFrame() {
  const corner = 'absolute h-8 w-8 border-white/80'
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-8 top-[16%] bottom-[10%]">
      <span className={`${corner} top-0 left-0 rounded-tl-xl border-t-[3px] border-l-[3px]`} />
      <span className={`${corner} top-0 right-0 rounded-tr-xl border-t-[3px] border-r-[3px]`} />
      <span className={`${corner} bottom-0 left-0 rounded-bl-xl border-b-[3px] border-l-[3px]`} />
      <span className={`${corner} right-0 bottom-0 rounded-br-xl border-r-[3px] border-b-[3px]`} />
    </div>
  )
}
