import { Maximize, ScanSearch, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EditorHeader, ToolButton } from '../../shared/ui/EditorChrome'
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
    <div className="fixed inset-0 flex flex-col bg-slate-950 text-white">
      <EditorHeader
        title="Recortar"
        onCancel={() => navigate(-1)}
        onSave={handleSave}
        saving={busy === 'save'}
        saveDisabled={!corners || busy !== ''}
      />

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

      {message && (
        <p className="mx-6 mb-2 flex items-center justify-center gap-2 rounded-xl bg-amber-400/10 px-3 py-2 text-center text-sm text-amber-300">
          <TriangleAlert size={16} className="shrink-0" />
          {message}
        </p>
      )}

      <div className="flex justify-center gap-6 px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <ToolButton
          icon={ScanSearch}
          label="Detectar bordes"
          onClick={handleDetect}
          disabled={!page || busy !== ''}
          busy={busy === 'detect'}
        />
        <ToolButton
          icon={Maximize}
          label="Imagen completa"
          onClick={() => page && setCorners(fullImageCorners(page.width, page.height))}
          disabled={!page || busy !== ''}
        />
      </div>
    </div>
  )
}
