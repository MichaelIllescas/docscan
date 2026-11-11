import type { Corners } from '../../domain/page'

export type VisionRequest =
  | { id: number; type: 'detect'; bitmap: ImageBitmap }
  | { id: number; type: 'warp'; bitmap: ImageBitmap; corners: Corners }

export type VisionResponse =
  | { id: number; type: 'detect'; corners: Corners | null }
  | { id: number; type: 'warp'; blob: Blob; width: number; height: number }
  | { id: number; type: 'error'; message: string }
