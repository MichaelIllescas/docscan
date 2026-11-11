import { jpgFileName, pdfFileName, QUALITY_PRESETS, type ExportOptions } from '../../domain/export'
import { compressJpeg } from '../../shared/image'
import { buildPdf, type JpegImage } from './buildPdf'

type Progress = (done: number, total: number) => void

async function compressPages(pages: Blob[], options: ExportOptions, onProgress?: Progress): Promise<JpegImage[]> {
  const { maxSide, jpegQuality } = QUALITY_PRESETS[options.quality]
  const images: JpegImage[] = []
  for (const [i, blob] of pages.entries()) {
    const compressed = await compressJpeg(blob, maxSide, jpegQuality)
    images.push({ bytes: new Uint8Array(await compressed.blob.arrayBuffer()), width: compressed.width, height: compressed.height })
    onProgress?.(i + 1, pages.length)
  }
  return images
}

export async function exportPdf(name: string, pages: Blob[], options: ExportOptions, onProgress?: Progress): Promise<File> {
  const images = await compressPages(pages, options, onProgress)
  const bytes = await buildPdf(images, options.paper, name)
  return new File([bytes], pdfFileName(name), { type: 'application/pdf' })
}

export async function exportJpgs(name: string, pages: Blob[], options: ExportOptions): Promise<File[]> {
  const images = await compressPages(pages, options)
  return images.map((img, i) => new File([img.bytes], jpgFileName(name, i, images.length), { type: 'image/jpeg' }))
}
