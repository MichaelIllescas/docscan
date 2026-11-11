import { describe, expect, it } from 'vitest'
import { applyAdjustments, rotate, rotatedSize, type Pixels } from './adjustments'

function solid(width: number, height: number, rgb: [number, number, number]): Pixels {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < data.length; i += 4) data.set([...rgb, 255], i)
  return { data, width, height }
}

const pixel = (px: Pixels, x: number, y: number) => Array.from(px.data.slice((y * px.width + x) * 4, (y * px.width + x) * 4 + 3))

describe('adjustments', () => {
  it('rota en pasos de 90 grados', () => {
    expect(rotate(0, 'right')).toBe(90)
    expect(rotate(0, 'left')).toBe(270)
    expect(rotate(270, 'right')).toBe(0)
  })

  it('intercambia ancho y alto al rotar 90', () => {
    expect(rotatedSize(100, 50, 90)).toEqual({ width: 50, height: 100 })
    expect(rotatedSize(100, 50, 180)).toEqual({ width: 100, height: 50 })
  })

  it('original sin cambios no modifica los píxeles', () => {
    const px = solid(2, 2, [10, 20, 30])
    applyAdjustments(px, { filter: 'original', brightness: 0, contrast: 0 })
    expect(pixel(px, 0, 0)).toEqual([10, 20, 30])
  })

  it('escala de grises iguala los canales', () => {
    const px = solid(1, 1, [200, 100, 50])
    applyAdjustments(px, { filter: 'grayscale', brightness: 0, contrast: 0 })
    const [r, g, b] = pixel(px, 0, 0)
    expect(r).toBe(g)
    expect(g).toBe(b)
  })

  it('brillo positivo aclara', () => {
    const px = solid(1, 1, [100, 100, 100])
    applyAdjustments(px, { filter: 'original', brightness: 50, contrast: 0 })
    expect(pixel(px, 0, 0)[0]).toBeGreaterThan(100)
  })

  it('blanco y negro deja texto oscuro en negro y el fondo en blanco', () => {
    const px = solid(40, 40, [220, 210, 200])
    for (let y = 18; y < 22; y++) for (let x = 5; x < 35; x++) px.data.set([40, 40, 40], (y * 40 + x) * 4)
    applyAdjustments(px, { filter: 'bw', brightness: 0, contrast: 0 })
    expect(pixel(px, 20, 20)).toEqual([0, 0, 0])
    expect(pixel(px, 20, 5)).toEqual([255, 255, 255])
  })

  it('mejorado lleva el fondo hacia el blanco', () => {
    const px = solid(10, 10, [180, 180, 180])
    px.data.set([30, 30, 30], 0)
    applyAdjustments(px, { filter: 'enhanced', brightness: 0, contrast: 0 })
    expect(pixel(px, 5, 5)[0]).toBe(255)
  })
})
