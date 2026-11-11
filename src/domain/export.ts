export type PaperSize = 'a4' | 'letter' | 'fit'
export type ExportQuality = 'high' | 'medium' | 'low'

export interface ExportOptions {
  paper: PaperSize
  quality: ExportQuality
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = { paper: 'a4', quality: 'medium' }

/** Tamaños en puntos PDF (1 pt = 1/72 pulgada), orientación vertical. */
export const PAPER_SIZES: Record<Exclude<PaperSize, 'fit'>, { width: number; height: number }> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
}

/** Lado largo de la página en modo "ajustado a la imagen": equivale a A4. */
const FIT_LONG_SIDE = 841.89

export const QUALITY_PRESETS: Record<ExportQuality, { maxSide: number; jpegQuality: number }> = {
  high: { maxSide: 2000, jpegQuality: 0.9 },
  medium: { maxSide: 1600, jpegQuality: 0.75 },
  low: { maxSide: 1200, jpegQuality: 0.6 },
}

export interface PdfPageLayout {
  pageWidth: number
  pageHeight: number
  /** Posición y tamaño de la imagen dentro de la página (origen abajo-izquierda, como en PDF). */
  x: number
  y: number
  width: number
  height: number
}

/**
 * Calcula la página y dónde va la imagen. El papel gira para coincidir con la orientación de la
 * imagen, y la imagen se escala para entrar completa, centrada, sin deformarse.
 */
export function layoutPdfPage(imageWidth: number, imageHeight: number, paper: PaperSize): PdfPageLayout {
  const landscape = imageWidth > imageHeight

  if (paper === 'fit') {
    const scale = FIT_LONG_SIDE / Math.max(imageWidth, imageHeight)
    const width = imageWidth * scale
    const height = imageHeight * scale
    return { pageWidth: width, pageHeight: height, x: 0, y: 0, width, height }
  }

  const base = PAPER_SIZES[paper]
  const pageWidth = landscape ? base.height : base.width
  const pageHeight = landscape ? base.width : base.height
  const scale = Math.min(pageWidth / imageWidth, pageHeight / imageHeight)
  const width = imageWidth * scale
  const height = imageHeight * scale
  return { pageWidth, pageHeight, x: (pageWidth - width) / 2, y: (pageHeight - height) / 2, width, height }
}

export function pdfFileName(documentName: string): string {
  return `${documentName || 'documento'}.pdf`
}

export function jpgFileName(documentName: string, pageIndex: number, totalPages: number): string {
  const base = documentName || 'documento'
  if (totalPages === 1) return `${base}.jpg`
  const digits = String(totalPages).length
  return `${base} - ${String(pageIndex + 1).padStart(digits, '0')}.jpg`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}
