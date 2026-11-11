import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDownUp, Clock3, Files, MoreVertical, ScanLine, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { InstallPrompt } from '../../app/InstallPrompt'
import { filterAndSortDocuments, type ScanDocument, type SortBy } from '../../domain/document'
import { documentRepository } from '../../infrastructure/db'
import { ConfirmDialog } from '../../shared/ConfirmDialog'
import { formatDate, pagesLabel } from '../../shared/formatDate'
import { Thumbnail } from '../../shared/Thumbnail'
import { useIncrementalList } from '../../shared/useIncrementalList'
import { DocumentActionsSheet } from './DocumentActionsSheet'
import { StorageFooter } from './StorageFooter'

const PAGE_SIZE = 30

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
  const [menuDoc, setMenuDoc] = useState<ScanDocument | null>(null)
  const [docToDelete, setDocToDelete] = useState<ScanDocument | null>(null)

  const filtered = useMemo(() => filterAndSortDocuments(documents ?? [], query, sortBy), [documents, query, sortBy])
  const { visible, hasMore, sentinelRef } = useIncrementalList(filtered, PAGE_SIZE, `${query}|${sortBy}`)

  const total = documents?.length ?? 0
  const isEmptyLibrary = documents !== undefined && total === 0

  return (
    <>
      <header className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-600 to-sky-500 px-4 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-5 text-white">
        <div aria-hidden className="absolute -top-16 -right-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-cyan-300/20 blur-2xl" />

        <div className="relative flex items-center gap-3">
          <img src="/pwa-64x64.png" alt="" className="h-11 w-11 rounded-2xl bg-white p-1 shadow-lg shadow-brand-900/30" />
          <div>
            <h1 className="text-xl leading-tight font-bold tracking-tight">DocScan</h1>
            <p className="text-sm text-white/75">
              {total === 0 ? 'Tus documentos, en el celular' : `${total} ${total === 1 ? 'documento' : 'documentos'}`}
            </p>
          </div>
        </div>

        {!isEmptyLibrary && (
          <div className="relative mt-4 flex gap-2">
            <label className="relative min-w-0 flex-1">
              <Search size={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Buscar documentos"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl bg-white py-2.5 pr-9 pl-10 text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-white/60 [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 active:bg-slate-100"
                >
                  <X size={16} />
                </button>
              )}
            </label>
            <label className="relative flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur active:bg-white/25">
              <ArrowDownUp size={19} />
              <select
                aria-label="Ordenar"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="absolute inset-0 cursor-pointer opacity-0"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </header>

      <InstallPrompt />

      <main className="flex-1 px-4 pt-4 pb-32">
        {isEmptyLibrary && <EmptyLibrary onScan={() => navigate('/scan')} />}

        {!isEmptyLibrary && documents && filtered.length === 0 && (
          <div className="mt-16 flex flex-col items-center text-center text-slate-500">
            <Search size={32} className="text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">Sin resultados</p>
            <p className="text-sm">No hay documentos que coincidan con “{query}”.</p>
          </div>
        )}

        {filtered.length > 0 && (
          <p className="mb-2 px-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
          </p>
        )}

        <ul className="flex flex-col gap-2.5">
          {visible.map((doc) => (
            <li key={doc.id} className="flex animate-fade-in items-center rounded-2xl bg-white shadow-card">
              <Link to={`/doc/${doc.id}`} className="flex min-w-0 flex-1 items-center gap-3.5 rounded-l-2xl p-3 active:bg-slate-50">
                <Thumbnail blob={doc.thumbnailBlob} className="h-16 w-12" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{doc.name}</p>
                  <p className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Files size={13} />
                      {pagesLabel(doc.pageIds.length)}
                    </span>
                    <span className="flex min-w-0 items-center gap-1">
                      <Clock3 size={13} className="shrink-0" />
                      <span className="truncate">{formatDate(doc.updatedAt)}</span>
                    </span>
                  </p>
                </div>
              </Link>
              <button
                onClick={() => setMenuDoc(doc)}
                aria-label={`Opciones de ${doc.name}`}
                className="mr-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-400 active:bg-slate-100"
              >
                <MoreVertical size={20} />
              </button>
            </li>
          ))}
        </ul>

        {hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-6" aria-live="polite">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" aria-label="Cargando más" />
          </div>
        )}

        {total > 0 && <StorageFooter docCount={total} />}
      </main>

      {menuDoc && (
        <DocumentActionsSheet
          doc={menuDoc}
          onClose={() => setMenuDoc(null)}
          onDelete={() => {
            setDocToDelete(menuDoc)
            setMenuDoc(null)
          }}
        />
      )}

      <ConfirmDialog
        open={docToDelete !== null}
        title="¿Eliminar documento?"
        message={`"${docToDelete?.name}" y todas sus páginas se borrarán. No se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={async () => {
          if (docToDelete) await documentRepository.remove(docToDelete.id)
          setDocToDelete(null)
        }}
        onCancel={() => setDocToDelete(null)}
      />

      {!isEmptyLibrary && (
        <button
          onClick={() => navigate('/scan')}
          className="fixed right-4 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] flex items-center gap-2 rounded-2xl bg-gradient-to-br from-brand-600 to-sky-500 px-5 py-4 font-semibold text-white shadow-float transition-transform active:scale-95"
        >
          <ScanLine size={22} />
          Escanear
        </button>
      )}
    </>
  )
}

function EmptyLibrary({ onScan }: { onScan: () => void }) {
  return (
    <div className="mx-auto mt-10 flex max-w-xs flex-col items-center text-center">
      <div className="relative">
        <div aria-hidden className="absolute inset-0 scale-125 rounded-full bg-brand-200/50 blur-2xl" />
        <img src="/pwa-192x192.png" alt="" className="relative h-32 w-32" />
      </div>
      <h2 className="mt-6 text-xl font-bold text-slate-900">Escaneá tu primer documento</h2>
      <p className="mt-2 text-sm text-slate-500">
        Sacá fotos con la cámara o elegilas de la galería. DocScan detecta la hoja, la endereza y la convierte en PDF.
      </p>
      <button
        onClick={onScan}
        className="mt-6 flex items-center gap-2 rounded-2xl bg-gradient-to-br from-brand-600 to-sky-500 px-6 py-3.5 font-semibold text-white shadow-float transition-transform active:scale-95"
      >
        <ScanLine size={20} />
        Empezar a escanear
      </button>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">Todo se procesa en tu dispositivo, sin internet.</p>
    </div>
  )
}
