import { describe, expect, it } from 'vitest'
import { clampCorners, isConvexQuad, orderCorners, quadArea, scaleCorners, warpedSize } from './geometry'
import type { Corners } from './page'

const square: Corners = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
]

describe('geometry', () => {
  it('ordena puntos desordenados en sentido horario desde arriba-izquierda', () => {
    const shuffled = [square[2], square[0], square[3], square[1]]
    expect(orderCorners(shuffled)).toEqual(square)
  })

  it('calcula el tamaño enderezado con el lado más largo', () => {
    const trapezoid: Corners = [
      { x: 10, y: 0 },
      { x: 90, y: 0 },
      { x: 100, y: 200 },
      { x: 0, y: 200 },
    ]
    expect(warpedSize(trapezoid)).toEqual({ width: 100, height: 200 })
  })

  it('detecta cuadriláteros cruzados como no convexos', () => {
    expect(isConvexQuad(square)).toBe(true)
    const crossed: Corners = [square[0], square[2], square[1], square[3]]
    expect(isConvexQuad(crossed)).toBe(false)
  })

  it('calcula el área', () => {
    expect(quadArea(square)).toBe(10000)
  })

  it('escala y limita esquinas', () => {
    expect(scaleCorners(square, 2)[2]).toEqual({ x: 200, y: 200 })
    expect(clampCorners([{ x: -5, y: 3 }, square[1], { x: 150, y: 120 }, square[3]], 100, 100)[0]).toEqual({ x: 0, y: 3 })
  })
})
