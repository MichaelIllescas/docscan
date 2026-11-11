import { DEFAULT_EXPORT_OPTIONS, type ExportOptions } from '../../domain/export'

const OPTIONS_STORAGE_KEY = 'docscan.exportOptions'

/** Últimas opciones de exportación usadas (por dispositivo). */
export function loadExportOptions(): ExportOptions {
  try {
    const saved = localStorage.getItem(OPTIONS_STORAGE_KEY)
    return saved ? { ...DEFAULT_EXPORT_OPTIONS, ...JSON.parse(saved) } : DEFAULT_EXPORT_OPTIONS
  } catch {
    return DEFAULT_EXPORT_OPTIONS
  }
}

export function saveExportOptions(options: ExportOptions): void {
  try {
    localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(options))
  } catch {
    /* sin almacenamiento: no se recuerdan las opciones */
  }
}
