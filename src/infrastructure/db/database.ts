import Dexie, { type EntityTable } from 'dexie'
import type { ScanDocument } from '../../domain/document'
import type { Page } from '../../domain/page'

export class DocScanDatabase extends Dexie {
  documents!: EntityTable<ScanDocument, 'id'>
  pages!: EntityTable<Page, 'id'>

  constructor(name = 'docscan') {
    super(name)
    this.version(1).stores({
      documents: 'id, name, updatedAt',
      pages: 'id, documentId',
    })
  }
}
