import { useEffect, type ReactNode } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  label: string
  children: ReactNode
}

/** Panel que sube desde abajo, con fondo oscurecido. Se cierra tocando afuera o con Escape. */
export function BottomSheet({ open, onClose, label, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex animate-fade-in items-end justify-center bg-slate-900/45 backdrop-blur-[2px]" onClick={onClose}>
      <div
        role="menu"
        aria-label={label}
        className="w-full max-w-md animate-sheet-in rounded-t-3xl bg-white px-3 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div aria-hidden className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-slate-200" />
        {children}
      </div>
    </div>
  )
}
