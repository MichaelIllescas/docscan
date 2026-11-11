import { describe, expect, it } from 'vitest'
import { createPage, fullImageCorners, unprocessedCapture } from './page'

describe('page domain', () => {
  it('las esquinas por defecto cubren toda la imagen en sentido horario', () => {
    expect(fullImageCorners(100, 50)).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 0, y: 50 },
    ])
  })

  it('crea una página sin procesar a partir de una imagen', () => {
    const blob = new Blob(['x'], { type: 'image/jpeg' })
    const page = createPage('doc-1', unprocessedCapture({ blob, width: 200, height: 300 }))
    expect(page.documentId).toBe('doc-1')
    expect(page.originalBlob).toBe(blob)
    expect(page.processedBlob).toBe(blob)
    expect(page.filter).toBe('original')
    expect(page.rotation).toBe(0)
    expect(page.corners[2]).toEqual({ x: 200, y: 300 })
  })
})
