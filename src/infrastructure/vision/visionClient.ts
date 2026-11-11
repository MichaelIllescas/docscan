import type { CapturedImage, Corners } from '../../domain/page'
import type { VisionRequest, VisionResponse } from './protocol'

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

let worker: Worker | null = null
let nextId = 0
const pending = new Map<number, { resolve: (r: VisionResponse) => void; reject: (e: Error) => void }>()

function getWorker(): Worker {
  if (worker) return worker
  worker = new Worker(new URL('./vision.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = (event: MessageEvent<VisionResponse>) => {
    const res = event.data
    const entry = pending.get(res.id)
    if (!entry) return
    pending.delete(res.id)
    if (res.type === 'error') entry.reject(new Error(res.message))
    else entry.resolve(res)
  }
  worker.onerror = (event) => {
    pending.forEach(({ reject }) => reject(new Error(event.message || 'Falló el procesador de imágenes')))
    pending.clear()
    worker?.terminate()
    worker = null
  }
  return worker
}

async function call(request: DistributiveOmit<VisionRequest, 'id'>): Promise<VisionResponse> {
  const id = nextId++
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    getWorker().postMessage({ ...request, id }, [request.bitmap])
  })
}

/** Busca el contorno del documento. Devuelve null si no encuentra uno confiable. */
export async function detectCorners(image: Blob): Promise<Corners | null> {
  const res = await call({ type: 'detect', bitmap: await createImageBitmap(image) })
  return res.type === 'detect' ? res.corners : null
}

/** Endereza la región delimitada por las esquinas. */
export async function warpImage(image: Blob, corners: Corners): Promise<CapturedImage> {
  const res = await call({ type: 'warp', bitmap: await createImageBitmap(image), corners })
  if (res.type !== 'warp') throw new Error('Respuesta inesperada')
  return { blob: res.blob, width: res.width, height: res.height }
}

/** Precarga OpenCV en segundo plano para que la primera detección sea rápida. */
export function warmUpVision(): void {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 8
  canvas.getContext('2d')?.fillRect(0, 0, 8, 8)
  createImageBitmap(canvas)
    .then((bitmap) => call({ type: 'detect', bitmap }))
    .catch(() => undefined)
}
