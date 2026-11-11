import { useLayoutEffect, useRef, useState } from 'react'
import { clampCorners } from '../../domain/geometry'
import type { Corners, Point } from '../../domain/page'

interface CornerEditorProps {
  imageUrl: string
  imageWidth: number
  imageHeight: number
  corners: Corners
  onChange: (corners: Corners) => void
}

const HANDLE_SIZE = 28
const LOUPE_SIZE = 120
const LOUPE_ZOOM = 2.5

/** Muestra la foto con un cuadrilátero editable: 4 esquinas arrastrables y una lupa mientras se arrastra. */
export function CornerEditor({ imageUrl, imageWidth, imageHeight, corners, onChange }: CornerEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  const [dragging, setDragging] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setScale(Math.min(el.clientWidth / imageWidth, el.clientHeight / imageHeight))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [imageWidth, imageHeight])

  const displayW = imageWidth * scale
  const displayH = imageHeight * scale

  function toImagePoint(e: React.PointerEvent): Point {
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect()
    return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale }
  }

  function handlePointerMove(index: number, e: React.PointerEvent) {
    if (dragging !== index) return
    const next = [...corners] as Corners
    next[index] = toImagePoint(e)
    onChange(clampCorners(next, imageWidth, imageHeight))
  }

  const polygon = corners.map((p) => `${p.x * scale},${p.y * scale}`).join(' ')
  const active = dragging !== null ? corners[dragging] : null
  const loupeOnRight = active ? active.x * scale < displayW / 2 : false

  return (
    <div ref={containerRef} className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {scale > 0 && (
        <div className="relative touch-none select-none" style={{ width: displayW, height: displayH }}>
          <img src={imageUrl} alt="" draggable={false} className="h-full w-full" />
          <svg className="pointer-events-none absolute inset-0" width={displayW} height={displayH}>
            <defs>
              <mask id="crop-mask">
                <rect width="100%" height="100%" fill="white" />
                <polygon points={polygon} fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.45)" mask="url(#crop-mask)" />
            <polygon points={polygon} fill="rgba(37,99,235,0.12)" stroke="#3b82f6" strokeWidth={2} />
          </svg>

          {corners.map((p, i) => (
            <div
              key={i}
              role="slider"
              aria-label={`Esquina ${i + 1}`}
              aria-valuenow={Math.round(p.x)}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId)
                setDragging(i)
              }}
              onPointerMove={(e) => handlePointerMove(i, e)}
              onPointerUp={() => setDragging(null)}
              onPointerCancel={() => setDragging(null)}
              className="absolute rounded-full border-[3px] border-white bg-blue-600/80 shadow-md"
              style={{
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                left: p.x * scale - HANDLE_SIZE / 2,
                top: p.y * scale - HANDLE_SIZE / 2,
                touchAction: 'none',
              }}
            />
          ))}

          {active && (
            <div
              className="pointer-events-none absolute top-2 overflow-hidden rounded-full border-4 border-white shadow-xl"
              style={{
                width: LOUPE_SIZE,
                height: LOUPE_SIZE,
                [loupeOnRight ? 'right' : 'left']: 8,
                backgroundImage: `url(${imageUrl})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: `${displayW * LOUPE_ZOOM}px ${displayH * LOUPE_ZOOM}px`,
                backgroundPosition: `${LOUPE_SIZE / 2 - active.x * scale * LOUPE_ZOOM}px ${LOUPE_SIZE / 2 - active.y * scale * LOUPE_ZOOM}px`,
              }}
            >
              <span className="absolute top-1/2 left-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-blue-500" />
              <span className="absolute top-1/2 left-1/2 h-0.5 w-4 -translate-x-1/2 -translate-y-1/2 bg-blue-500" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
