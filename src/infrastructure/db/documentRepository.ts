import { createDocument, MAX_NAME_LENGTH, renameDocument, type ScanDocument } from '../../domain/document'
import { createPage, type Page, type ProcessedCapture } from '../../domain/page'
import type { DocScanDatabase } from './database'

export type PageChanges = Partial<Omit<Page, 'id' | 'documentId' | 'originalBlob' | 'width' | 'height'>>

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

    /** Páginas del documento en el orden definido por `pageIds`. */
    async getPages(id: string): Promise<Page[]> {
      const doc = await db.documents.get(id)
      if (!doc) return []
      const pages = await db.pages.bulkGet(doc.pageIds)
      return pages.filter((p): p is Page => p !== undefined)
    },

    getPage: (pageId: string) => db.pages.get(pageId),

    /** Agrega capturas al final del documento. Si no tiene miniatura, usa `thumbnail`. */
    async addPages(id: string, captures: ProcessedCapture[], thumbnail?: Blob): Promise<ScanDocument> {
      return db.transaction('rw', db.documents, db.pages, async () => {
        const doc = await getOrThrow(id)
        const pages = captures.map((capture) => createPage(id, capture))
        await db.pages.bulkAdd(pages)
        const updated: ScanDocument = {
          ...doc,
          pageIds: [...doc.pageIds, ...pages.map((p) => p.id)],
          thumbnailBlob: doc.thumbnailBlob ?? thumbnail,
          updatedAt: Date.now(),
        }
        await db.documents.put(updated)
        return updated
      })
    },

    /** Guarda cambios de una página (recorte o ajustes). Si es la primera, reemplaza la miniatura del documento. */
    async updatePage(pageId: string, changes: PageChanges, thumbnail?: Blob): Promise<void> {
      await db.transaction('rw', db.documents, db.pages, async () => {
        const page = await db.pages.get(pageId)
        if (!page) throw new Error('Página no encontrada')
        await db.pages.update(pageId, changes)
        const doc = await getOrThrow(page.documentId)
        const isFirst = doc.pageIds[0] === pageId
        await db.documents.update(doc.id, {
          updatedAt: Date.now(),
          ...(isFirst && thumbnail ? { thumbnailBlob: thumbnail } : {}),
        })
      })
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
