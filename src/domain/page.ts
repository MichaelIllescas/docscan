export interface Point {
  x: number
  y: number
}

export type Rotation = 0 | 90 | 180 | 270
export type PageFilter = 'original' | 'grayscale' | 'bw' | 'enhanced'

export interface Page {
  id: string
  documentId: string
  originalBlob: Blob
  processedBlob: Blob
  corners: [Point, Point, Point, Point]
  rotation: Rotation
  filter: PageFilter
  brightness: number
  contrast: number
}
