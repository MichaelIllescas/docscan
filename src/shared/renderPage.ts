import { applyAdjustments, rotatedSize, type PageAdjustments } from '../domain/adjustments'
import { fitWithin } from './image'

const JPEG_QUALITY = 0.9

/** Dibuja la imagen rotada y con filtros en `canvas`, limitada a `maxSide` px. */
export function renderToCanvas(
  source: ImageBitmap,
  adj: PageAdjustments,
  canvas: HTMLCanvasElement,
  maxSide = Infinity,
): void {
  const fitted = fitWithin(source.width, source.height, maxSide)
  const { width, height } = rotatedSize(fitted.width, fitted.height, adj.rotation)
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas no disponible')
  ctx.save()
  ctx.translate(width / 2, height / 2)
  ctx.rotate((adj.rotation * Math.PI) / 180)
  ctx.drawImage(source, -fitted.width / 2, -fitted.height / 2, fitted.width, fitted.height)
  ctx.restore()
  if (adj.filter === 'original' && adj.brightness === 0 && adj.contrast === 0) return
  const pixels = ctx.getImageData(0, 0, width, height)
  applyAdjustments(pixels, adj)
  ctx.putImageData(pixels, 0, 0)
}

/** Genera el JPEG final a resolución completa. */
export async function renderAdjusted(cropped: Blob, adj: PageAdjustments): Promise<Blob> {
  const bitmap = await createImageBitmap(cropped)
  const canvas = document.createElement('canvas')
  try {
    renderToCanvas(bitmap, adj, canvas)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo generar la imagen'))), 'image/jpeg', JPEG_QUALITY),
    )
  } finally {
    bitmap.close()
    canvas.width = canvas.height = 0
  }
}
