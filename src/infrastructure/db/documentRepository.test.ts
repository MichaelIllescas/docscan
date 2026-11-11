import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Page } from '../../domain/page'
import { DocScanDatabase } from './database'
import { createDocumentRepository, type DocumentRepository } from './documentRepository'

const fakePage = (id: string, documentId: string) => ({ id, documentId }) as unknown as Page

describe('documentRepository', () => {
  let db: DocScanDatabase
  let repo: DocumentRepository

  beforeEach(() => {
    db = new DocScanDatabase(`test-${crypto.randomUUID()}`)
    repo = createDocumentRepository(db)
  })

  afterEach(async () => {
    await db.delete()
  })

  it('crea y lista documentos', async () => {
    await repo.create()
    await repo.create()
    expect(await repo.getAll()).toHaveLength(2)
  })

  it('renombra un documento', async () => {
    const doc = await repo.create()
    await repo.rename(doc.id, 'Contrato')
    expect((await repo.getById(doc.id))?.name).toBe('Contrato')
  })

  it('elimina el documento y sus páginas', async () => {
    const doc = await repo.create()
    await db.pages.add(fakePage('p1', doc.id))
    await repo.remove(doc.id)
    expect(await repo.getById(doc.id)).toBeUndefined()
    expect(await db.pages.count()).toBe(0)
  })

  it('agrega páginas al final y conserva el orden', async () => {
    const doc = await repo.create()
    const img = (w: number) => ({ blob: new Blob(['x']), width: w, height: 10 })
    await repo.addPages(doc.id, [img(1), img(2)])
    await repo.addPages(doc.id, [img(3)])
    const pages = await repo.getPages(doc.id)
    expect(pages.map((p) => p.width)).toEqual([1, 2, 3])
    expect((await repo.getById(doc.id))?.pageIds).toHaveLength(3)
  })

  it('duplica el documento con copias de sus páginas', async () => {
    const doc = await repo.create()
    await db.pages.add(fakePage('p1', doc.id))
    await db.documents.update(doc.id, { pageIds: ['p1'] })
    const copy = await repo.duplicate(doc.id)
    expect(copy.name).toContain('(copia)')
    expect(copy.pageIds).toHaveLength(1)
    expect(copy.pageIds[0]).not.toBe('p1')
    expect(await db.pages.count()).toBe(2)
  })
})
