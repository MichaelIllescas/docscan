import { moveItem } from '../../domain/document'
import { documentRepository } from '../../infrastructure/db'
import { createThumbnail } from '../../shared/image'

/** Regenera la miniatura del documento a partir de su primera página. */
async function refreshThumbnail(docId: string): Promise<void> {
  const [first] = await documentRepository.getPages(docId)
  if (first) await documentRepository.setThumbnail(docId, await createThumbnail(first.processedBlob))
}

export async function reorderPage(docId: string, pageIds: string[], from: number, to: number): Promise<void> {
  const next = moveItem(pageIds, from, to)
  await documentRepository.reorderPages(docId, next)
  if (next[0] !== pageIds[0]) await refreshThumbnail(docId)
}

export async function duplicatePage(pageId: string): Promise<void> {
  await documentRepository.duplicatePage(pageId)
}

export async function deletePage(docId: string, pageId: string, wasFirst: boolean): Promise<void> {
  await documentRepository.removePage(pageId)
  if (wasFirst) await refreshThumbnail(docId)
}
