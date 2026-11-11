export interface Point {
  x: number
  y: number
}

export type Corners = [Point, Point, Point, Point]
export type Rotation = 0 | 90 | 180 | 270
export type PageFilter = 'original' | 'grayscale' | 'bw' | 'enhanced'

export interface Page {
  id: string
  documentId: string
  /** Foto original (redimensionada). Permite volver a recortar. */
  originalBlob: Blob
  /** Recorte enderezado, sin filtros ni rotación. Ausente en páginas viejas: usar `processedBlob`. */
  croppedBlob?: Blob
  /** Resultado final: recorte + rotación + filtro + brillo/contraste. */
  processedBlob: Blob
  width: number
  height: number
  corners: Corners
  rotation: Rotation
  filter: PageFilter
  brightness: number
  contrast: number
}

export interface CapturedImage {
  blob: Blob
  width: number
  height: number
}

/** Esquinas en sentido horario desde arriba-izquierda, cubriendo la imagen completa. */
export function fullImageCorners(width: number, height: number): Corners {
  return [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ]
}

/** Resultado de procesar una captura: la foto original, el recorte enderezado y sus esquinas. */
export interface ProcessedCapture {
  original: CapturedImage
  processed: Blob
  corners: Corners
}

export function unprocessedCapture(image: CapturedImage): ProcessedCapture {
  return { original: image, processed: image.blob, corners: fullImageCorners(image.width, image.height) }
}

export function createPage(documentId: string, capture: ProcessedCapture): Page {
  const { original } = capture
  return {
    id: crypto.randomUUID(),
    documentId,
    originalBlob: original.blob,
    croppedBlob: capture.processed,
    processedBlob: capture.processed,
    width: original.width,
    height: original.height,
    corners: capture.corners,
    rotation: 0,
    filter: 'original',
    brightness: 0,
    contrast: 0,
  }
}
