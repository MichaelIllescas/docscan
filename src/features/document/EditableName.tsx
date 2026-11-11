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
      <button onClick={startEditing} className="min-w-0 flex-1 truncate text-left text-lg font-semibold" title="Renombrar">
        {name} <span className="text-sm font-normal opacity-70">✎</span>
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
      className="min-w-0 flex-1 rounded-lg bg-white px-3 py-1.5 text-lg text-slate-900"
    />
  )
}
