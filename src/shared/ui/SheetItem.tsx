import type { LucideIcon } from 'lucide-react'

interface SheetItemProps {
  icon: LucideIcon
  label: string
  description?: string
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
}

export function SheetItem({ icon: Icon, label, description, onClick, disabled, destructive }: SheetItemProps) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3.5 rounded-2xl px-3 py-2.5 text-left transition-colors active:bg-slate-100 disabled:opacity-40 hover-hover:hover:bg-slate-50"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          destructive ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600'
        }`}
      >
        <Icon size={20} strokeWidth={2} />
      </span>
      <span className="min-w-0">
        <span className={`block font-medium ${destructive ? 'text-red-600' : 'text-slate-900'}`}>{label}</span>
        {description && <span className="block truncate text-xs text-slate-500">{description}</span>}
      </span>
    </button>
  )
}
