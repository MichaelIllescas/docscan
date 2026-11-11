import type { CapturedImage } from '../domain/page'

export const MAX_IMAGE_SIDE = 2000
export const THUMBNAIL_SIDE = 320
const JPEG_QUALITY = 0.9

type ImageSource = CanvasImageSource & { width?: number; height?: number }

export function fitWithin(width: number, height: number, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality = JPEG_QUALITY): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo generar la imagen'))), 'image/jpeg', quality)
  })
}

async function drawScaled(
  source: ImageSource,
  srcWidth: number,
  srcHeight: number,
  maxSide: number,
  quality?: number,
): Promise<CapturedImage> {
  const { width, height } = fitWithin(srcWidth, srcHeight, maxSide)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas no disponible')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, width, height)
  const blob = await canvasToJpeg(canvas, quality)
  canvas.width = canvas.height = 0
  return { blob, width, height }
}

/** Foto de galería → JPEG redimensionado. Respeta la orientación EXIF. */
export async function normalizeImageFile(file: Blob): Promise<CapturedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    return await drawScaled(bitmap, bitmap.width, bitmap.height, MAX_IMAGE_SIDE)
  } finally {
    bitmap.close()
  }
}

/** Fotograma actual del video de la cámara → JPEG redimensionado. */
export function captureVideoFrame(video: HTMLVideoElement): Promise<CapturedImage> {
  return drawScaled(video, video.videoWidth, video.videoHeight, MAX_IMAGE_SIDE)
}

export async function createThumbnail(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob)
  try {
    return (await drawScaled(bitmap, bitmap.width, bitmap.height, THUMBNAIL_SIDE, 0.75)).blob
  } finally {
    bitmap.close()
  }
}
