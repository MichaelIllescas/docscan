import type { PageFilter, Rotation } from './page'

export interface PageAdjustments {
  rotation: Rotation
  filter: PageFilter
  /** -100..100 */
  brightness: number
  /** -100..100 */
  contrast: number
}

export const DEFAULT_ADJUSTMENTS: PageAdjustments = { rotation: 0, filter: 'original', brightness: 0, contrast: 0 }

/** Estructura mínima de píxeles RGBA (compatible con ImageData, sin depender del DOM). */
export interface Pixels {
  data: Uint8ClampedArray
  width: number
  height: number
}

export function rotate(rotation: Rotation, direction: 'left' | 'right'): Rotation {
  return (((rotation + (direction === 'right' ? 90 : 270)) % 360) as Rotation)
}

export function rotatedSize(width: number, height: number, rotation: Rotation) {
  return rotation === 90 || rotation === 270 ? { width: height, height: width } : { width, height }
}

const luma = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b

function toGrayscale(px: Pixels): void {
  const d = px.data
  for (let i = 0; i < d.length; i += 4) {
    const y = luma(d[i], d[i + 1], d[i + 2])
    d[i] = d[i + 1] = d[i + 2] = y
  }
}

/**
 * Estira los niveles entre los percentiles 1 y 90 de luminancia. En un documento el papel ocupa la
 * mayor parte, así que el percentil 90 cae en el fondo: queda blanco y el texto se oscurece.
 */
function autoLevels(px: Pixels): void {
  const d = px.data
  const histogram = new Uint32Array(256)
  for (let i = 0; i < d.length; i += 4) histogram[Math.round(luma(d[i], d[i + 1], d[i + 2]))]++
  const total = d.length / 4
  const percentile = (p: number) => {
    let acc = 0
    for (let v = 0; v < 256; v++) {
      acc += histogram[v]
      if (acc >= total * p) return v
    }
    return 255
  }
  const lo = percentile(0.01)
  const hi = Math.max(lo + 1, percentile(0.9))
  const scale = 255 / (hi - lo)
  for (let i = 0; i < d.length; i += 4) {
    d[i] = (d[i] - lo) * scale
    d[i + 1] = (d[i + 1] - lo) * scale
    d[i + 2] = (d[i + 2] - lo) * scale
  }
}

/**
 * Blanco y negro con umbral adaptativo (media local por imagen integral):
 * tolera sombras e iluminación despareja mejor que un umbral fijo.
 */
function adaptiveThreshold(px: Pixels, offset = 0.12): void {
  const { data: d, width: w, height: h } = px
  const gray = new Float32Array(w * h)
  for (let i = 0, p = 0; p < gray.length; i += 4, p++) gray[p] = luma(d[i], d[i + 1], d[i + 2])

  const integral = new Float64Array((w + 1) * (h + 1))
  for (let y = 0; y < h; y++) {
    let rowSum = 0
    for (let x = 0; x < w; x++) {
      rowSum += gray[y * w + x]
      integral[(y + 1) * (w + 1) + (x + 1)] = integral[y * (w + 1) + (x + 1)] + rowSum
    }
  }

  const half = Math.max(4, Math.round(Math.max(w, h) / 40))
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - half)
    const y1 = Math.min(h, y + half + 1)
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - half)
      const x1 = Math.min(w, x + half + 1)
      const sum =
        integral[y1 * (w + 1) + x1] - integral[y0 * (w + 1) + x1] - integral[y1 * (w + 1) + x0] + integral[y0 * (w + 1) + x0]
      const mean = sum / ((x1 - x0) * (y1 - y0))
      const v = gray[y * w + x] < mean * (1 - offset) ? 0 : 255
      const i = (y * w + x) * 4
      d[i] = d[i + 1] = d[i + 2] = v
    }
  }
}

function brightnessContrast(px: Pixels, brightness: number, contrast: number): void {
  if (brightness === 0 && contrast === 0) return
  const c = contrast * 1.28
  const factor = (259 * (c + 255)) / (255 * (259 - c))
  const offset = brightness * 1.28
  const lut = new Uint8ClampedArray(256)
  for (let v = 0; v < 256; v++) lut[v] = factor * (v - 128) + 128 + offset
  const d = px.data
  for (let i = 0; i < d.length; i += 4) {
    d[i] = lut[d[i]]
    d[i + 1] = lut[d[i + 1]]
    d[i + 2] = lut[d[i + 2]]
  }
}

/** Aplica filtro y luego brillo/contraste, modificando los píxeles en el lugar. La rotación se hace al dibujar. */
export function applyAdjustments(px: Pixels, adj: Pick<PageAdjustments, 'filter' | 'brightness' | 'contrast'>): void {
  switch (adj.filter) {
    case 'grayscale':
      toGrayscale(px)
      break
    case 'enhanced':
      autoLevels(px)
      break
    case 'bw':
      adaptiveThreshold(px)
      break
  }
  brightnessContrast(px, adj.brightness, adj.contrast)
}
