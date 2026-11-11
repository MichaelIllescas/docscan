import { useLiveQuery } from 'dexie-react-hooks'
import { Camera, Clock3, CopyPlus, Crop, FileDown, Files, Hand, Plus, SlidersHorizontal, Trash2, Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { moveItem } from '../../domain/document'
import type { Page } from '../../domain/page'
import { documentRepository } from '../../infrastructure/db'
import { ActionSheet } from '../../shared/ActionSheet'
import { ConfirmDialog } from '../../shared/ConfirmDialog'
import { formatDate, pagesLabel } from '../../shared/formatDate'
import { AppHeader, IconButton } from '../../shared/ui/AppHeader'
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
        <Link to="/" className="font-medium text-brand-600">
          Volver a la biblioteca
        </Link>
      </main>
    )
  }

  const hasPages = doc.pageIds.length > 0
  const editPage = (pageId: string) => navigate(`/doc/${id}/page/${pageId}/edit`)
  const addPages = () => navigate(`/scan?doc=${id}`)

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
      <AppHeader
        onBack={() => navigate('/')}
        actions={
          <>
            <IconButton label="Duplicar documento" onClick={handleDuplicate}>
              <Copy size={20} />
            </IconButton>
            <IconButton label="Eliminar documento" tone="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={20} />
            </IconButton>
          </>
        }
      >
        <EditableName name={doc.name} onSave={(name) => documentRepository.rename(id, name)} />
      </AppHeader>

      <main className="flex-1 px-4 pt-4 pb-32">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
          <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-card">
            <Files size={14} className="text-brand-600" />
            {pagesLabel(doc.pageIds.length)}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-card">
            <Clock3 size={14} className="text-brand-600" />
            {formatDate(doc.updatedAt)}
          </span>
        </div>

        {doc.pageIds.length > 1 && (
          <p className="mb-3 flex items-center gap-1.5 text-xs text-slate-400">
            <Hand size={14} />
            Mantené presionada una página para moverla
          </p>
        )}

        {orderedPages && orderedPages.length === 0 && (
          <button
            onClick={addPages}
            className="flex w-full flex-col items-center rounded-3xl border-2 border-dashed border-brand-200 bg-brand-50/50 px-6 py-12 text-center active:bg-brand-50"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-card">
              <Camera size={26} />
            </span>
            <span className="mt-4 font-semibold text-slate-900">Este documento está vacío</span>
            <span className="mt-1 text-sm text-slate-500">Tocá para escanear o importar páginas</span>
          </button>
        )}

        {orderedPages && orderedPages.length > 0 && (
          <PageGrid
            pages={orderedPages}
            onReorder={handleReorder}
            onOpen={(page) => editPage(page.id)}
            onMenu={(page, index) => setMenuPage({ page, index })}
          />
        )}
      </main>

      {hasPages && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/70 bg-white/90 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl">
          <div className="mx-auto flex max-w-md gap-2">
            <button
              onClick={addPages}
              className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3.5 font-semibold text-slate-700 active:bg-slate-200"
            >
              <Plus size={20} />
              Agregar
            </button>
            <button
              onClick={() => navigate(`/doc/${id}/export`)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-brand-600 to-sky-500 py-3.5 font-semibold text-white shadow-float active:scale-[0.98]"
            >
              <FileDown size={20} />
              Exportar PDF
            </button>
          </div>
        </div>
      )}

      <ActionSheet
        open={menuPage !== null}
        title={menuPage ? `Página ${menuPage.index + 1}` : undefined}
        onClose={() => setMenuPage(null)}
        actions={
          menuPage
            ? [
                { label: 'Editar filtros y rotación', icon: SlidersHorizontal, onSelect: () => editPage(menuPage.page.id) },
                { label: 'Recortar', icon: Crop, onSelect: () => navigate(`/doc/${id}/page/${menuPage.page.id}/crop`) },
                { label: 'Duplicar página', icon: CopyPlus, onSelect: () => duplicatePage(menuPage.page.id) },
                { label: 'Eliminar página', icon: Trash2, destructive: true, onSelect: () => setPageToDelete(menuPage) },
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
