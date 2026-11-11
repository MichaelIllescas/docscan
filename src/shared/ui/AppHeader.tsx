import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'

interface AppHeaderProps {
  onBack?: () => void
  children: ReactNode
  actions?: ReactNode
}

/** Barra superior clara y pegajosa, con botón de volver opcional. */
export function AppHeader({ onBack, children, actions }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-1 border-b border-slate-200/70 bg-white/85 px-2 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-2 backdrop-blur-xl">
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Volver"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-700 active:bg-slate-100"
        >
          <ChevronLeft size={24} />
        </button>
      )}
      <div className={`flex min-w-0 flex-1 items-center ${onBack ? '' : 'pl-2'}`}>{children}</div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </header>
  )
}

interface IconButtonProps {
  label: string
  onClick: () => void
  children: ReactNode
  tone?: 'default' | 'danger'
}

export function IconButton({ label, onClick, children, tone = 'default' }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-10 w-10 items-center justify-center rounded-full active:bg-slate-100 ${
        tone === 'danger' ? 'text-red-600' : 'text-slate-600'
      }`}
    >
      {children}
    </button>
  )
}
