export interface SheetAction {
  label: string
  onSelect: () => void
  destructive?: boolean
}

interface ActionSheetProps {
  open: boolean
  title?: string
  actions: SheetAction[]
  onClose: () => void
}

export function ActionSheet({ open, title, actions, onClose }: ActionSheetProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        role="menu"
        aria-label={title}
        className="w-full max-w-md rounded-t-2xl bg-white p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <p className="px-4 pt-2 pb-1 text-center text-sm text-slate-500">{title}</p>}
        {actions.map((action) => (
          <button
            key={action.label}
            role="menuitem"
            onClick={() => {
              onClose()
              action.onSelect()
            }}
            className={`block w-full rounded-lg px-4 py-3 text-left font-medium active:bg-slate-100 ${action.destructive ? 'text-red-600' : ''}`}
          >
            {action.label}
          </button>
        ))}
        <button onClick={onClose} className="mt-1 block w-full rounded-lg px-4 py-3 text-center text-slate-500 active:bg-slate-100">
          Cancelar
        </button>
      </div>
    </div>
  )
}
