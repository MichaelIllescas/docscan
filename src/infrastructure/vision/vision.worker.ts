/// <reference lib="webworker" />
import { isConvexQuad, orderCorners, quadArea, scaleCorners, warpedSize } from '../../domain/geometry'
import type { Corners, Point } from '../../domain/page'
import type { VisionRequest, VisionResponse } from './protocol'

type CV = typeof import('@techstark/opencv-js')

const DETECT_MAX_SIDE = 600
const MIN_AREA_RATIO = 0.2
const JPEG_QUALITY = 0.9

let cvPromise: Promise<CV> | null = null

type CvModule = CV & { then?: (cb: (m: CvModule) => void) => void; onRuntimeInitialized?: () => void }

/**
 * Carga OpenCV una sola vez. opencv.js es un script UMD clásico (no un módulo ES), así que se sirve
 * como archivo estático (public/vendor, copiado en postinstall) y se evalúa en el ámbito global del worker.
 * El módulo de Emscripten es un "thenable" que se resuelve a sí mismo: se le quita `then` para no entrar en bucle.
 */
function loadOpenCv(): Promise<CV> {
  cvPromise ??= fetch(`${import.meta.env.BASE_URL}vendor/opencv.js`)
    .then((response) => {
      if (!response.ok) throw new Error('No se pudo descargar OpenCV')
      return response.text()
    })
    .then((source) => {
      ;(0, eval)(source)
      return waitUntilReady((self as unknown as { cv: CvModule }).cv)
    })
  return cvPromise
}

function waitUntilReady(cv: CvModule): Promise<CV> {
  return new Promise<CV>((resolve) => {
    if (typeof cv.Mat === 'function') {
      delete cv.then
      resolve(cv)
    } else if (typeof cv.then === 'function') {
      cv.then((ready) => {
        delete ready.then
        resolve(ready)
      })
    } else {
      cv.onRuntimeInitialized = () => resolve(cv)
    }
  })
}

function bitmapToImageData(bitmap: ImageBitmap, maxSide = Infinity): { data: ImageData; scale: number } {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = new OffscreenCanvas(w, h)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, w, h)
  return { data: ctx.getImageData(0, 0, w, h), scale }
}

async function detect(bitmap: ImageBitmap): Promise<Corners | null> {
  const cv = await loadOpenCv()
  const { data, scale } = bitmapToImageData(bitmap, DETECT_MAX_SIDE)
  const src = cv.matFromImageData(data)
  const gray = new cv.Mat()
  const edges = new cv.Mat()
  const contours = new cv.MatVector()
  const hierarchy = new cv.Mat()
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3))
  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0)
    cv.Canny(gray, edges, 50, 150)
    cv.dilate(edges, edges, kernel)
    cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)

    const minArea = data.width * data.height * MIN_AREA_RATIO
    let best: Corners | null = null
    let bestArea = 0
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i)
      const approx = new cv.Mat()
      try {
        const area = cv.contourArea(contour)
        if (area < minArea || area <= bestArea) continue
        cv.approxPolyDP(contour, approx, 0.02 * cv.arcLength(contour, true), true)
        if (approx.rows !== 4) continue
        const pts: Point[] = []
        for (let j = 0; j < 4; j++) pts.push({ x: approx.data32S[j * 2], y: approx.data32S[j * 2 + 1] })
        const corners = orderCorners(pts)
        if (!isConvexQuad(corners)) continue
        best = corners
        bestArea = quadArea(corners)
      } finally {
        approx.delete()
        contour.delete()
      }
    }
    return best ? scaleCorners(best, 1 / scale) : null
  } finally {
    ;[src, gray, edges, contours, hierarchy, kernel].forEach((m) => m.delete())
  }
}

async function warp(bitmap: ImageBitmap, corners: Corners) {
  const cv = await loadOpenCv()
  const { width, height } = warpedSize(corners)
  const { data } = bitmapToImageData(bitmap)
  const src = cv.matFromImageData(data)
  const dst = new cv.Mat()
  const from = cv.matFromArray(4, 1, cv.CV_32FC2, corners.flatMap((p) => [p.x, p.y]))
  const to = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, width, 0, width, height, 0, height])
  const matrix = cv.getPerspectiveTransform(from, to)
  try {
    cv.warpPerspective(src, dst, matrix, new cv.Size(width, height), cv.INTER_LINEAR, cv.BORDER_REPLICATE)
    const canvas = new OffscreenCanvas(width, height)
    canvas.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(dst.data), width, height), 0, 0)
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY })
    return { blob, width, height }
  } finally {
    ;[src, dst, from, to, matrix].forEach((m) => m.delete())
  }
}

self.onmessage = async (event: MessageEvent<VisionRequest>) => {
  const req = event.data
  let res: VisionResponse
  try {
    if (req.type === 'detect') res = { id: req.id, type: 'detect', corners: await detect(req.bitmap) }
    else res = { id: req.id, type: 'warp', ...(await warp(req.bitmap, req.corners)) }
  } catch (error) {
    res = { id: req.id, type: 'error', message: error instanceof Error ? error.message : String(error) }
  } finally {
    req.bitmap.close()
  }
  self.postMessage(res)
}
