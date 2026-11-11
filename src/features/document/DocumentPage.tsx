import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { documentRepository } from '../../infrastructure/db'
import { ConfirmDialog } from '../../shared/ConfirmDialog'
import { formatDate, pagesLabel } from '../../shared/formatDate'
import { EditableName } from './EditableName'

export function DocumentPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const doc = useLiveQuery(() => documentRepository.getById(id), [id], null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (doc === null) return null
  if (!doc) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <p className="text-slate-500">Este documento no existe.</p>
        <Link to="/" className="text-blue-600">
          Volver a la biblioteca
        </Link>
      </main>
    )
  }

  async function handleDuplicate() {
    const copy = await documentRepository.duplicate(id)
    navigate(`/doc/${copy.id}`, { replace: true })
  }

  async function handleDelete() {
    await documentRepository.remove(id)
    navigate('/', { replace: true })
  }

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center gap-2 bg-blue-600 px-2 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 text-white">
        <Link to="/" aria-label="Volver" className="rounded-lg px-3 py-2 text-xl">
          ←
        </Link>
        <EditableName name={doc.name} onSave={(name) => documentRepository.rename(id, name)} />
      </header>

      <main className="flex-1 p-4">
        <p className="text-sm text-slate-500">
          {pagesLabel(doc.pageIds.length)} · Editado {formatDate(doc.updatedAt)}
        </p>

        <div className="mt-10 rounded-xl border-2 border-dashed border-slate-300 p-8 text-center text-slate-500">
          Sin páginas todavía. La cámara llega en la fase 2.
        </div>

        <div className="mt-8 flex gap-2">
          <button className="flex-1 rounded-lg bg-white py-3 font-medium shadow-sm active:bg-slate-100" onClick={handleDuplicate}>
            Duplicar
          </button>
          <button
            className="flex-1 rounded-lg bg-white py-3 font-medium text-red-600 shadow-sm active:bg-slate-100"
            onClick={() => setConfirmDelete(true)}
          >
            Eliminar
          </button>
        </div>
      </main>

      <ConfirmDialog
        open={confirmDelete}
        title="¿Eliminar documento?"
        message={`"${doc.name}" y todas sus páginas se borrarán. No se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}
