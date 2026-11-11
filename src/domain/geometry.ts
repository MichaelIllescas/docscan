import type { Corners, Point } from './page'

export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

/**
 * Ordena 4 puntos cualesquiera en sentido horario empezando por arriba-izquierda:
 * TL = menor x+y, BR = mayor x+y, TR = menor y-x, BL = mayor y-x.
 */
export function orderCorners(points: Point[]): Corners {
  if (points.length !== 4) throw new Error('Se necesitan 4 puntos')
  const bySum = [...points].sort((a, b) => a.x + a.y - (b.x + b.y))
  const byDiff = [...points].sort((a, b) => a.y - a.x - (b.y - b.x))
  return [bySum[0], byDiff[0], bySum[3], byDiff[3]]
}

/** Tamaño de la imagen enderezada: el lado más largo de cada par opuesto. */
export function warpedSize([tl, tr, br, bl]: Corners) {
  return {
    width: Math.round(Math.max(distance(tl, tr), distance(bl, br))),
    height: Math.round(Math.max(distance(tl, bl), distance(tr, br))),
  }
}

export function scaleCorners(corners: Corners, factor: number): Corners {
  return corners.map((p) => ({ x: p.x * factor, y: p.y * factor })) as Corners
}

export function clampCorners(corners: Corners, width: number, height: number): Corners {
  return corners.map((p) => ({
    x: Math.min(width, Math.max(0, p.x)),
    y: Math.min(height, Math.max(0, p.y)),
  })) as Corners
}

/** Un cuadrilátero válido para enderezar es convexo (todos los giros en el mismo sentido). */
export function isConvexQuad(corners: Corners): boolean {
  let sign = 0
  for (let i = 0; i < 4; i++) {
    const a = corners[i]
    const b = corners[(i + 1) % 4]
    const c = corners[(i + 2) % 4]
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)
    if (cross === 0) return false
    const s = Math.sign(cross)
    if (sign === 0) sign = s
    else if (s !== sign) return false
  }
  return true
}

export function quadArea(corners: Corners): number {
  let sum = 0
  for (let i = 0; i < 4; i++) {
    const a = corners[i]
    const b = corners[(i + 1) % 4]
    sum += a.x * b.y - b.x * a.y
  }
  return Math.abs(sum) / 2
}
