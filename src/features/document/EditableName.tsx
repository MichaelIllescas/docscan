import { Pencil } from 'lucide-react'
import { useRef, useState } from 'react'
import { MAX_NAME_LENGTH, sanitizeDocumentName } from '../../domain/document'

interface EditableNameProps {
  name: string
  onSave: (name: string) => Promise<unknown>
}

export function EditableName({ name, onSave }: EditableNameProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const editingRef = useRef(false)

  function startEditing() {
    setDraft(name)
    editingRef.current = true
    setEditing(true)
  }

  async function commit() {
    if (!editingRef.current) return
    editingRef.current = false
    setEditing(false)
    const clean = sanitizeDocumentName(draft)
    if (clean && clean !== name) await onSave(clean)
  }

  if (!editing) {
    return (
      <button
        onClick={startEditing}
        className="group flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1 text-left active:opacity-70"
        title="Renombrar"
      >
        <span className="truncate text-lg font-semibold text-slate-900">{name}</span>
        <Pencil size={15} className="shrink-0 text-slate-400" />
      </button>
    )
  }

  return (
    <input
      autoFocus
      aria-label="Nombre del documento"
      value={draft}
      maxLength={MAX_NAME_LENGTH}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') {
          editingRef.current = false
          setEditing(false)
        }
      }}
      className="min-w-0 flex-1 rounded-xl bg-slate-100 px-3 py-1.5 text-lg font-semibold text-slate-900 outline-none ring-2 ring-brand-500"
    />
  )
}
