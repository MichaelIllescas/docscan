import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useIncrementalList } from './useIncrementalList'

let trigger: (() => void) | null = null

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      cb: IntersectionObserverCallback
      constructor(cb: IntersectionObserverCallback) {
        this.cb = cb
      }
      observe() {
        trigger = () => this.cb([{ isIntersecting: true } as IntersectionObserverEntry], this as never)
      }
      disconnect() {}
    },
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  trigger = null
})

const items = Array.from({ length: 70 }, (_, i) => i)

describe('useIncrementalList', () => {
  it('muestra la primera tanda y suma otra al llegar al final', () => {
    const { result } = renderHook(() => useIncrementalList(items, 30, 'a'))
    expect(result.current.visible).toHaveLength(30)
    expect(result.current.hasMore).toBe(true)

    act(() => result.current.sentinelRef(document.createElement('div')))
    act(() => trigger?.())
    expect(result.current.visible).toHaveLength(60)
  })

  it('vuelve a la primera tanda cuando cambia la búsqueda', () => {
    const { result, rerender } = renderHook(({ key }) => useIncrementalList(items, 30, key), { initialProps: { key: 'a' } })
    act(() => result.current.sentinelRef(document.createElement('div')))
    act(() => trigger?.())
    rerender({ key: 'b' })
    expect(result.current.visible).toHaveLength(30)
  })
})
