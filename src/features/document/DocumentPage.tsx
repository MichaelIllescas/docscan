import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { moveItem } from '../../domain/document'
import type { Page } from '../../domain/page'
import { documentRepository } from '../../infrastructure/db'
import { ActionSheet } from '../../shared/ActionSheet'
import { ConfirmDialog } from '../../shared/ConfirmDialog'
import { formatDate, pagesLabel } from '../../shared/formatDate'
import { EditableName } from './EditableName'
import { deletePage, duplicatePage, reorderPage } from './pageActions'
import { PageGrid } from './PageGrid'

interface SelectedPage {
  page: Page
  index: number
}

export function DocumentPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const doc = useLiveQuery(() => documentRepository.getById(id), [id], null)
  const pages = useLiveQuery(() => documentRepository.getPages(id), [id])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [menuPage, setMenuPage] = useState<SelectedPage | null>(null)
  const [pageToDelete, setPageToDelete] = useState<SelectedPage | null>(null)
  /** Orden optimista: se muestra al soltar, antes de que la base confirme el cambio. */
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null)

  const orderedPages = useMemo(() => {
    if (!pages || !pendingOrder) return pages
    const byId = new Map(pages.map((p) => [p.id, p]))
    return pendingOrder.map((pid) => byId.get(pid)).filter((p): p is Page => p !== undefined)
  }, [pages, pendingOrder])

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

  const editPage = (pageId: string) => navigate(`/doc/${id}/page/${pageId}/edit`)

  async function handleReorder(from: number, to: number) {
    if (!doc) return
    setPendingOrder(moveItem(doc.pageIds, from, to))
    try {
      await reorderPage(id, doc.pageIds, from, to)
    } finally {
      setPendingOrder(null)
    }
  }

  async function handleDuplicate() {
    const copy = await documentRepository.duplicate(id)
    navigate(`/doc/${copy.id}`, { replace: true })
  }

  async function handleDelete() {
    await documentRepository.remove(id)
    navigate('/', { replace: true })
  }

  async function handleDeletePage() {
    if (!pageToDelete) return
    const { page, index } = pageToDelete
    setPageToDelete(null)
    await deletePage(id, page.id, index === 0)
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
        {doc.pageIds.length > 1 && (
          <p className="mt-1 text-xs text-slate-400">Mantené presionada una página para moverla.</p>
        )}

        {orderedPages && orderedPages.length === 0 && (
          <div className="mt-6 rounded-xl border-2 border-dashed border-slate-300 p-8 text-center text-slate-500">
            Sin páginas todavía.
          </div>
        )}
        {orderedPages && (
          <PageGrid
            pages={orderedPages}
            onReorder={handleReorder}
            onOpen={(page) => editPage(page.id)}
            onMenu={(page, index) => setMenuPage({ page, index })}
          />
        )}

        <button
          onClick={() => navigate(`/scan?doc=${id}`)}
          className="mt-6 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white active:bg-blue-700"
        >
          + Agregar páginas
        </button>

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

      <ActionSheet
        open={menuPage !== null}
        title={menuPage ? `Página ${menuPage.index + 1}` : undefined}
        onClose={() => setMenuPage(null)}
        actions={
          menuPage
            ? [
                { label: 'Editar', onSelect: () => editPage(menuPage.page.id) },
                { label: 'Recortar', onSelect: () => navigate(`/doc/${id}/page/${menuPage.page.id}/crop`) },
                { label: 'Duplicar página', onSelect: () => duplicatePage(menuPage.page.id) },
                { label: 'Eliminar página', destructive: true, onSelect: () => setPageToDelete(menuPage) },
              ]
            : []
        }
      />

      <ConfirmDialog
        open={pageToDelete !== null}
        title="¿Eliminar página?"
        message={`Se borrará la página ${(pageToDelete?.index ?? 0) + 1}. No se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={handleDeletePage}
        onCancel={() => setPageToDelete(null)}
      />

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
