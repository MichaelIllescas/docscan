import { DocScanDatabase } from './database'
import { createDocumentRepository } from './documentRepository'

export const db = new DocScanDatabase()
export const documentRepository = createDocumentRepository(db)
