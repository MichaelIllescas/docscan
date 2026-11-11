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
  originalBlob: Blob
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

export function createPage(documentId: string, image: CapturedImage): Page {
  return {
    id: crypto.randomUUID(),
    documentId,
    originalBlob: image.blob,
    processedBlob: image.blob,
    width: image.width,
    height: image.height,
    corners: fullImageCorners(image.width, image.height),
    rotation: 0,
    filter: 'original',
    brightness: 0,
    contrast: 0,
  }
}
