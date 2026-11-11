import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Muestra los elementos de a tandas: arranca con `pageSize` y suma otra tanda cuando el
 * "centinela" (un elemento al final de la lista) entra en pantalla. Vuelve al inicio si cambia `resetKey`.
 */
export function useIncrementalList<T>(items: T[], pageSize: number, resetKey: unknown) {
  const [limit, setLimit] = useState(pageSize)
  const [prevKey, setPrevKey] = useState(resetKey)
  const observerRef = useRef<IntersectionObserver | null>(null)

  if (prevKey !== resetKey) {
    setPrevKey(resetKey)
    setLimit(pageSize)
  }

  const hasMore = items.length > limit

  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      observerRef.current?.disconnect()
      if (!node || !hasMore) return
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) setLimit((l) => l + pageSize)
        },
        { rootMargin: '400px' },
      )
      observerRef.current.observe(node)
    },
    [hasMore, pageSize],
  )

  useEffect(() => () => observerRef.current?.disconnect(), [])

  return { visible: items.slice(0, limit), hasMore, sentinelRef }
}
