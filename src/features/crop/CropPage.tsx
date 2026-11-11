import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { isConvexQuad } from '../../domain/geometry'
import { fullImageCorners, type Corners, type Page } from '../../domain/page'
import { documentRepository } from '../../infrastructure/db'
import { detectCorners, warpImage } from '../../infrastructure/vision/visionClient'
import { createThumbnail } from '../../shared/image'
import { renderAdjusted } from '../../shared/renderPage'
import { useObjectUrl } from '../../shared/useObjectUrl'
import { CornerEditor } from './CornerEditor'

export function CropPage() {
  const { id = '', pageId = '' } = useParams()
  const navigate = useNavigate()
  const [page, setPage] = useState<Page | null>(null)
  const [corners, setCorners] = useState<Corners | null>(null)
  const [busy, setBusy] = useState<'' | 'detect' | 'save'>('')
  const [message, setMessage] = useState('')
  const imageUrl = useObjectUrl(page?.originalBlob)

  useEffect(() => {
    documentRepository.getPage(pageId).then((p) => {
      if (!p) return navigate(`/doc/${id}`, { replace: true })
      setPage(p)
      setCorners(p.corners)
    })
  }, [id, pageId, navigate])

  async function handleDetect() {
    if (!page) return
    setBusy('detect')
    setMessage('')
    try {
      const found = await detectCorners(page.originalBlob)
      if (found) setCorners(found)
      else setMessage('No se encontraron bordes. Ajustá las esquinas a mano.')
    } finally {
      setBusy('')
    }
  }

  async function handleSave() {
    if (!page || !corners) return
    if (!isConvexQuad(corners)) {
      setMessage('Las esquinas se cruzan. Acomodalas formando un cuadrilátero.')
      return
    }
    setBusy('save')
    try {
      const warped = await warpImage(page.originalBlob, corners)
      const processed = await renderAdjusted(warped.blob, page)
      const thumbnail = await createThumbnail(processed)
      await documentRepository.updatePage(page.id, { corners, croppedBlob: warped.blob, processedBlob: processed }, thumbnail)
      navigate(`/doc/${id}/page/${pageId}/edit`, { replace: true })
    } catch {
      setMessage('No se pudo recortar la imagen. Probá de nuevo.')
      setBusy('')
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-neutral-900 text-white">
      <header className="flex items-center justify-between px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3">
        <button onClick={() => navigate(-1)} className="px-2 py-1">
          Cancelar
        </button>
        <h1 className="font-semibold">Recortar</h1>
        <button onClick={handleSave} disabled={!corners || busy !== ''} className="px-2 py-1 font-semibold text-blue-400 disabled:opacity-40">
          {busy === 'save' ? 'Guardando…' : 'Guardar'}
        </button>
      </header>

      <div className="min-h-0 flex-1 p-4">
        {page && corners && imageUrl && (
          <CornerEditor
            imageUrl={imageUrl}
            imageWidth={page.width}
            imageHeight={page.height}
            corners={corners}
            onChange={(c) => {
              setCorners(c)
              setMessage('')
            }}
          />
        )}
      </div>

      {message && <p className="px-6 pb-2 text-center text-sm text-amber-300">{message}</p>}

      <div className="flex justify-center gap-3 px-4 pt-2 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <button onClick={handleDetect} disabled={!page || busy !== ''} className="rounded-lg bg-white/15 px-4 py-2 text-sm disabled:opacity-40">
          {busy === 'detect' ? 'Detectando…' : 'Detectar bordes'}
        </button>
        <button
          onClick={() => page && setCorners(fullImageCorners(page.width, page.height))}
          disabled={!page || busy !== ''}
          className="rounded-lg bg-white/15 px-4 py-2 text-sm disabled:opacity-40"
        >
          Imagen completa
        </button>
      </div>
    </div>
  )
}
