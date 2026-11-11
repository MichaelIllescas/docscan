import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useRef } from 'react'
import type { Page } from '../../domain/page'
import { Thumbnail } from '../../shared/Thumbnail'

interface PageGridProps {
  pages: Page[]
  onReorder: (from: number, to: number) => void
  onOpen: (page: Page) => void
  onMenu: (page: Page, index: number) => void
}

/**
 * Grilla de miniaturas reordenable. En el celular se arrastra con pulsación larga (así el scroll
 * sigue funcionando); con mouse, al mover unos píxeles. Un toque simple abre la página.
 */
export function PageGrid({ pages, onReorder, onOpen, onMenu }: PageGridProps) {
  const draggedRecently = useRef(false)
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd({ active, over }: DragEndEvent) {
    draggedRecently.current = true
    setTimeout(() => (draggedRecently.current = false), 100)
    if (!over || active.id === over.id) return
    const from = pages.findIndex((p) => p.id === active.id)
    const to = pages.findIndex((p) => p.id === over.id)
    if (from !== -1 && to !== -1) onReorder(from, to)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
        <ol className="mt-4 grid grid-cols-3 gap-3">
          {pages.map((page, index) => (
            <SortablePage
              key={page.id}
              page={page}
              index={index}
              onOpen={() => !draggedRecently.current && onOpen(page)}
              onMenu={() => onMenu(page, index)}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  )
}

interface SortablePageProps {
  page: Page
  index: number
  onOpen: () => void
  onMenu: () => void
}

function SortablePage({ page, index, onOpen, onMenu }: SortablePageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative touch-manipulation select-none ${isDragging ? 'z-10 scale-105 opacity-90 drop-shadow-xl' : ''}`}
    >
      <div
        {...attributes}
        {...listeners}
        role="button"
        aria-label={`Página ${index + 1}. Tocá para editar, mantené presionado para mover`}
        onClick={onOpen}
        onContextMenu={(e) => e.preventDefault()}
        className="flex flex-col items-center gap-1 [-webkit-touch-callout:none]"
      >
        <Thumbnail blob={page.processedBlob} className="pointer-events-none aspect-[3/4] w-full object-contain" />
        <span className="text-xs text-slate-500">{index + 1}</span>
      </div>
      <button
        onClick={onMenu}
        aria-label={`Opciones de la página ${index + 1}`}
        className="absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-sm text-white"
      >
        ⋯
      </button>
    </li>
  )
}
