import { HardDrive, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatFileSize } from '../../domain/export'
import { getStorageInfo, type StorageInfo } from '../../shared/storage'

/** Muestra cuánto espacio usan los documentos y avisa si el navegador podría borrarlos. */
export function StorageFooter({ docCount }: { docCount: number }) {
  const [info, setInfo] = useState<StorageInfo | null>(null)

  useEffect(() => {
    getStorageInfo().then(setInfo)
  }, [docCount])

  if (!info) return null

  return (
    <footer className="mt-8 space-y-1.5 text-center text-xs text-slate-400">
      <p className="flex items-center justify-center gap-1.5">
        <HardDrive size={13} />
        {formatFileSize(info.usage)} usados en este dispositivo
      </p>
      {!info.persisted && (
        <p className="mx-auto flex max-w-xs items-start justify-center gap-1.5">
          <ShieldAlert size={13} className="mt-px shrink-0" />
          Exportá los documentos importantes: el navegador podría liberar este espacio.
        </p>
      )}
    </footer>
  )
}
