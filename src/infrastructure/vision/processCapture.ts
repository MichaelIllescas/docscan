import { unprocessedCapture, type CapturedImage, type ProcessedCapture } from '../../domain/page'
import { detectCorners, warpImage } from './visionClient'

/** Detecta el documento y lo endereza. Si falla o no lo encuentra, conserva la foto completa. */
export async function processCapture(image: CapturedImage): Promise<ProcessedCapture> {
  try {
    const corners = await detectCorners(image.blob)
    if (!corners) return unprocessedCapture(image)
    const warped = await warpImage(image.blob, corners)
    return { original: image, processed: warped.blob, corners }
  } catch (error) {
    console.warn('No se pudo procesar la imagen', error)
    return unprocessedCapture(image)
  }
}
