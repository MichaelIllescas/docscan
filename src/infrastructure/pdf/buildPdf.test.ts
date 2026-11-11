import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import { buildPdf } from './buildPdf'

/** JPEG mínimo válido de 1x1 px. */
const TINY_JPEG = Uint8Array.from(
  atob(
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
  ),
  (c) => c.charCodeAt(0),
)

describe('buildPdf', () => {
  it('crea una página por imagen con el tamaño de papel elegido', async () => {
    const bytes = await buildPdf(
      [
        { bytes: TINY_JPEG, width: 1000, height: 2000 },
        { bytes: TINY_JPEG, width: 2000, height: 1000 },
      ],
      'a4',
      'Prueba',
    )
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBe(2)
    expect(pdf.getTitle()).toBe('Prueba')
    const [first, second] = pdf.getPages()
    expect(first.getWidth()).toBeLessThan(first.getHeight())
    expect(second.getWidth()).toBeGreaterThan(second.getHeight())
  })
})
