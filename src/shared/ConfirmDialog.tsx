import { Trash2 } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-slate-900/45 p-4 backdrop-blur-[2px] sm:items-center"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-labelledby="confirm-title"
        className="w-full max-w-sm animate-pop-in rounded-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <Trash2 size={22} />
        </span>
        <h2 id="confirm-title" className="mt-4 text-lg font-semibold text-slate-900">
          {title}
        </h2>
        <p className="mt-1.5 text-sm text-slate-500">{message}</p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button className="rounded-xl bg-slate-100 py-3 font-medium text-slate-700 active:bg-slate-200" onClick={onCancel}>
            Cancelar
          </button>
          <button className="rounded-xl bg-red-600 py-3 font-semibold text-white active:bg-red-700" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
