import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { filterAndSortDocuments, type SortBy } from '../../domain/document'
import { documentRepository } from '../../infrastructure/db'
import { formatDate, pagesLabel } from '../../shared/formatDate'

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'updated-desc', label: 'Más recientes' },
  { value: 'updated-asc', label: 'Más antiguos' },
  { value: 'name-asc', label: 'Nombre A-Z' },
  { value: 'name-desc', label: 'Nombre Z-A' },
]

export function LibraryPage() {
  const navigate = useNavigate()
  const documents = useLiveQuery(() => documentRepository.getAll(), [])
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('updated-desc')

  const visible = useMemo(
    () => filterAndSortDocuments(documents ?? [], query, sortBy),
    [documents, query, sortBy],
  )

  async function handleCreate() {
    const doc = await documentRepository.create()
    navigate(`/doc/${doc.id}`)
  }

  return (
    <>
      <header className="sticky top-0 z-10 bg-blue-600 px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-3 text-white">
        <h1 className="text-xl font-semibold">DocScan</h1>
        <div className="mt-3 flex gap-2">
          <input
            type="search"
            placeholder="Buscar documentos"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 rounded-lg bg-white/95 px-3 py-2 text-slate-900 placeholder:text-slate-400"
          />
          <select
            aria-label="Ordenar"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="rounded-lg bg-white/95 px-2 py-2 text-slate-900"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="flex-1 p-4 pb-28">
        {documents && visible.length === 0 && (
          <p className="mt-16 text-center text-slate-500">
            {query ? 'No hay documentos con ese nombre.' : 'Todavía no hay documentos. Tocá "Nuevo" para empezar.'}
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {visible.map((doc) => (
            <li key={doc.id}>
              <Link
                to={`/doc/${doc.id}`}
                className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm active:bg-slate-100"
              >
                <div className="flex h-14 w-11 shrink-0 items-center justify-center rounded-md bg-slate-200 text-xs text-slate-500">
                  PDF
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{doc.name}</p>
                  <p className="text-sm text-slate-500">
                    {pagesLabel(doc.pageIds.length)} · {formatDate(doc.updatedAt)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>

      <button
        onClick={handleCreate}
        className="fixed right-4 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] rounded-full bg-blue-600 px-6 py-4 font-semibold text-white shadow-lg active:bg-blue-700"
      >
        + Nuevo
      </button>
    </>
  )
}
