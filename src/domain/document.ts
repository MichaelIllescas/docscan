export interface ScanDocument {
  id: string
  name: string
  pageIds: string[]
  createdAt: number
  updatedAt: number
  thumbnailBlob?: Blob
}

export type SortBy = 'updated-desc' | 'updated-asc' | 'name-asc' | 'name-desc'

export const MAX_NAME_LENGTH = 100
const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g

const pad = (n: number) => String(n).padStart(2, '0')

export function defaultDocumentName(date: Date = new Date()): string {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const time = `${pad(date.getHours())}-${pad(date.getMinutes())}`
  return `Scan ${day} ${time}`
}

export function sanitizeDocumentName(raw: string): string {
  return raw.replace(INVALID_FILENAME_CHARS, '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH)
}

export function createDocument(now: number = Date.now()): ScanDocument {
  return {
    id: crypto.randomUUID(),
    name: defaultDocumentName(new Date(now)),
    pageIds: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function renameDocument(doc: ScanDocument, rawName: string, now: number = Date.now()): ScanDocument {
  const name = sanitizeDocumentName(rawName)
  if (!name) throw new Error('El nombre no puede estar vacío')
  return { ...doc, name, updatedAt: now }
}

const byName = (a: ScanDocument, b: ScanDocument) => a.name.localeCompare(b.name, 'es', { numeric: true })

const SORTERS: Record<SortBy, (a: ScanDocument, b: ScanDocument) => number> = {
  'updated-desc': (a, b) => b.updatedAt - a.updatedAt,
  'updated-asc': (a, b) => a.updatedAt - b.updatedAt,
  'name-asc': byName,
  'name-desc': (a, b) => byName(b, a),
}

export function filterAndSortDocuments(docs: ScanDocument[], query: string, sortBy: SortBy): ScanDocument[] {
  const q = query.trim().toLocaleLowerCase()
  const filtered = q ? docs.filter((d) => d.name.toLocaleLowerCase().includes(q)) : [...docs]
  return filtered.sort(SORTERS[sortBy])
}
