import { createDocument, MAX_NAME_LENGTH, renameDocument, type ScanDocument } from '../../domain/document'
import type { Page } from '../../domain/page'
import type { DocScanDatabase } from './database'

export function createDocumentRepository(db: DocScanDatabase) {
  async function getOrThrow(id: string): Promise<ScanDocument> {
    const doc = await db.documents.get(id)
    if (!doc) throw new Error('Documento no encontrado')
    return doc
  }

  return {
    getAll: () => db.documents.toArray(),

    getById: (id: string) => db.documents.get(id),

    async create(): Promise<ScanDocument> {
      const doc = createDocument()
      await db.documents.add(doc)
      return doc
    },

    async rename(id: string, name: string): Promise<ScanDocument> {
      const renamed = renameDocument(await getOrThrow(id), name)
      await db.documents.put(renamed)
      return renamed
    },

    async remove(id: string): Promise<void> {
      await db.transaction('rw', db.documents, db.pages, async () => {
        await db.pages.where('documentId').equals(id).delete()
        await db.documents.delete(id)
      })
    },

    async duplicate(id: string): Promise<ScanDocument> {
      return db.transaction('rw', db.documents, db.pages, async () => {
        const source = await getOrThrow(id)
        const now = Date.now()
        const copyId = crypto.randomUUID()
        const pages = await db.pages.bulkGet(source.pageIds)
        const pageCopies: Page[] = pages
          .filter((p): p is Page => p !== undefined)
          .map((p) => ({ ...p, id: crypto.randomUUID(), documentId: copyId }))
        const copy: ScanDocument = {
          ...source,
          id: copyId,
          name: `${source.name} (copia)`.slice(0, MAX_NAME_LENGTH),
          pageIds: pageCopies.map((p) => p.id),
          createdAt: now,
          updatedAt: now,
        }
        await db.pages.bulkAdd(pageCopies)
        await db.documents.add(copy)
        return copy
      })
    },
  }
}

export type DocumentRepository = ReturnType<typeof createDocumentRepository>
