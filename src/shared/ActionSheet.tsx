import type { LucideIcon } from 'lucide-react'
import { BottomSheet } from './ui/BottomSheet'
import { SheetItem } from './ui/SheetItem'

export interface SheetAction {
  label: string
  icon: LucideIcon
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
  return (
    <BottomSheet open={open} onClose={onClose} label={title ?? 'Opciones'}>
      {title && <p className="px-3 pt-1 pb-2 text-sm font-semibold text-slate-900">{title}</p>}
      {actions.map((action) => (
        <SheetItem
          key={action.label}
          icon={action.icon}
          label={action.label}
          destructive={action.destructive}
          onClick={() => {
            onClose()
            action.onSelect()
          }}
        />
      ))}
    </BottomSheet>
  )
}
