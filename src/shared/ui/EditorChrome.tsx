import { Check, Loader2, X, type LucideIcon } from 'lucide-react'

interface EditorHeaderProps {
  title: string
  onCancel: () => void
  onSave: () => void
  saving?: boolean
  saveDisabled?: boolean
}

/** Encabezado de las pantallas de edición (fondo oscuro): cancelar, título y guardar. */
export function EditorHeader({ title, onCancel, onSave, saving, saveDisabled }: EditorHeaderProps) {
  return (
    <header className="flex items-center justify-between px-3 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-2">
      <button
        onClick={onCancel}
        aria-label="Cancelar"
        className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 active:bg-white/10"
      >
        <X size={22} />
      </button>
      <h1 className="font-semibold">{title}</h1>
      <button
        onClick={onSave}
        disabled={saveDisabled || saving}
        aria-label="Guardar"
        className="flex h-10 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-semibold active:bg-brand-700 disabled:opacity-40"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />}
        Guardar
      </button>
    </header>
  )
}

interface ToolButtonProps {
  icon: LucideIcon
  label: string
  onClick: () => void
  disabled?: boolean
  busy?: boolean
  active?: boolean
}

/** Botón de herramienta con ícono arriba y etiqueta abajo. */
export function ToolButton({ icon: Icon, label, onClick, disabled, busy, active }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`flex min-w-16 flex-col items-center gap-1.5 rounded-2xl px-2 py-2 text-[11px] font-medium transition-colors disabled:opacity-40 ${
        active ? 'text-sky-300' : 'text-white/80 active:bg-white/10'
      }`}
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-full ${active ? 'bg-sky-400/20' : 'bg-white/10'}`}>
        {busy ? <Loader2 size={20} className="animate-spin" /> : <Icon size={20} />}
      </span>
      {label}
    </button>
  )
}
