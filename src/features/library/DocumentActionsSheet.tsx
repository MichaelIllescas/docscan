import { Download, Share2, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ScanDocument } from '../../domain/document'
import { formatFileSize } from '../../domain/export'
import { documentRepository } from '../../infrastructure/db'
import { exportPdf } from '../../infrastructure/pdf/exportDocument'
import { pagesLabel } from '../../shared/formatDate'
import { canShareFiles, downloadFile, shareFiles } from '../../shared/shareFiles'
import { Thumbnail } from '../../shared/Thumbnail'
import { BottomSheet } from '../../shared/ui/BottomSheet'
import { SheetItem } from '../../shared/ui/SheetItem'
import { loadExportOptions } from '../export/exportOptionsStore'

interface DocumentActionsSheetProps {
  doc: ScanDocument
  onClose: () => void
  onDelete: () => void
}

/**
 * Acciones rápidas desde la biblioteca. El PDF se genera al abrir el menú (con las últimas opciones
 * de exportación) para que "Compartir" se ejecute dentro del toque, como exige el navegador.
 */
export function DocumentActionsSheet({ doc, onClose, onDelete }: DocumentActionsSheetProps) {
  const [pdf, setPdf] = useState<File | null>(null)
  const [error, setError] = useState(false)
  const hasPages = doc.pageIds.length > 0

  useEffect(() => {
    if (!hasPages) return
    let cancelled = false
    documentRepository
      .getPages(doc.id)
      .then((pages) => exportPdf(doc.name, pages.map((p) => p.processedBlob), loadExportOptions()))
      .then((file) => !cancelled && setPdf(file))
      .catch(() => !cancelled && setError(true))
    return () => {
      cancelled = true
    }
  }, [doc.id, doc.name, hasPages])

  const shareSupported = pdf ? canShareFiles([pdf]) : typeof navigator.canShare === 'function'
  const pdfStatus = error ? 'No se pudo generar el PDF' : pdf ? `PDF listo · ${formatFileSize(pdf.size)}` : 'Preparando PDF…'

  async function handleShare() {
    if (!pdf) return
    if (!canShareFiles([pdf])) return downloadFile(pdf)
    try {
      if (await shareFiles([pdf], doc.name)) onClose()
    } catch {
      downloadFile(pdf)
    }
  }

  return (
    <BottomSheet open onClose={onClose} label={doc.name}>
      <div className="mb-2 flex items-center gap-3 border-b border-slate-100 px-3 pt-1 pb-3">
        <Thumbnail blob={doc.thumbnailBlob} className="h-14 w-10" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{doc.name}</p>
          <p className="text-xs text-slate-500">
            {pagesLabel(doc.pageIds.length)}
            {hasPages && <> · {pdfStatus}</>}
          </p>
        </div>
      </div>
      {hasPages && shareSupported && (
        <SheetItem icon={Share2} label="Compartir PDF" description="WhatsApp, mail, Drive…" disabled={!pdf} onClick={handleShare} />
      )}
      {hasPages && (
        <SheetItem
          icon={Download}
          label="Descargar PDF"
          description="Guardar en el dispositivo"
          disabled={!pdf}
          onClick={() => {
            if (!pdf) return
            downloadFile(pdf)
            onClose()
          }}
        />
      )}
      <SheetItem icon={Trash2} label="Eliminar" destructive onClick={onDelete} />
    </BottomSheet>
  )
}
