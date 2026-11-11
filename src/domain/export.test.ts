import { describe, expect, it } from 'vitest'
import { formatFileSize, jpgFileName, layoutPdfPage, PAPER_SIZES, pdfFileName } from './export'

describe('export domain', () => {
  it('centra una imagen vertical en A4 sin deformarla', () => {
    const l = layoutPdfPage(1000, 2000, 'a4')
    expect(l.pageWidth).toBeCloseTo(PAPER_SIZES.a4.width)
    expect(l.height).toBeCloseTo(PAPER_SIZES.a4.height)
    expect(l.width / l.height).toBeCloseTo(0.5)
    expect(l.x).toBeCloseTo((l.pageWidth - l.width) / 2)
    expect(l.y).toBeCloseTo(0)
  })

  it('mantiene la hoja vertical aunque la imagen sea horizontal', () => {
    const l = layoutPdfPage(2000, 1000, 'letter')
    expect(l.pageWidth).toBe(612)
    expect(l.pageHeight).toBe(792)
    expect(l.width).toBeCloseTo(612)
    expect(l.height).toBeCloseTo(306)
    expect(l.y).toBeCloseTo((792 - 306) / 2)
  })

  it('en modo ajustado la página tiene la proporción de la imagen', () => {
    const l = layoutPdfPage(1500, 2000, 'fit')
    expect(l.pageWidth / l.pageHeight).toBeCloseTo(0.75)
    expect(l).toMatchObject({ x: 0, y: 0 })
    expect(l.width).toBe(l.pageWidth)
  })

  it('arma nombres de archivo', () => {
    expect(pdfFileName('Factura')).toBe('Factura.pdf')
    expect(pdfFileName('')).toBe('documento.pdf')
    expect(jpgFileName('DNI', 0, 1)).toBe('DNI.jpg')
    expect(jpgFileName('Contrato', 2, 12)).toBe('Contrato - 03.jpg')
  })

  it('formatea tamaños', () => {
    expect(formatFileSize(500)).toBe('500 B')
    expect(formatFileSize(2048)).toBe('2 KB')
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1,5 MB')
  })
})
