import { describe, expect, it } from 'vitest'
import {
  createDocument,
  defaultDocumentName,
  filterAndSortDocuments,
  renameDocument,
  sanitizeDocumentName,
  type ScanDocument,
} from './document'

describe('document domain', () => {
  it('genera el nombre por defecto con fecha y hora', () => {
    expect(defaultDocumentName(new Date(2026, 10, 5, 9, 7))).toBe('Scan 2026-11-05 09-07')
  })

  it('crea un documento vacío', () => {
    const doc = createDocument(1000)
    expect(doc.pageIds).toEqual([])
    expect(doc.createdAt).toBe(1000)
    expect(doc.id).toBeTruthy()
  })

  it('limpia caracteres inválidos para nombre de archivo', () => {
    expect(sanitizeDocumentName('  Factura: luz/agua?  ')).toBe('Factura luzagua')
  })

  it('renombra y actualiza la fecha', () => {
    const renamed = renameDocument(createDocument(1000), 'DNI', 2000)
    expect(renamed.name).toBe('DNI')
    expect(renamed.updatedAt).toBe(2000)
  })

  it('rechaza nombres vacíos', () => {
    expect(() => renameDocument(createDocument(), '  /// ')).toThrow()
  })

  it('filtra por nombre y ordena', () => {
    const docs: ScanDocument[] = [
      { ...createDocument(1), name: 'Recibo 10', updatedAt: 1 },
      { ...createDocument(2), name: 'Recibo 2', updatedAt: 3 },
      { ...createDocument(3), name: 'DNI', updatedAt: 2 },
    ]
    expect(filterAndSortDocuments(docs, 'recibo', 'name-asc').map((d) => d.name)).toEqual(['Recibo 2', 'Recibo 10'])
    expect(filterAndSortDocuments(docs, '', 'updated-desc').map((d) => d.name)).toEqual(['Recibo 2', 'DNI', 'Recibo 10'])
  })
})
