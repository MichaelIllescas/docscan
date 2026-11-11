import { describe, expect, it } from 'vitest'
import { detectInstallPlatform } from './installPlatform'

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1'
const ANDROID = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36'
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15'

describe('detectInstallPlatform', () => {
  it('detecta la app ya instalada', () => {
    expect(detectInstallPlatform({ userAgent: ANDROID, maxTouchPoints: 5 }, true)).toBe('installed')
    expect(detectInstallPlatform({ userAgent: IPHONE, maxTouchPoints: 5, standalone: true }, false)).toBe('installed')
  })

  it('detecta iPhone y iPad (que se presenta como Mac táctil)', () => {
    expect(detectInstallPlatform({ userAgent: IPHONE, maxTouchPoints: 5 }, false)).toBe('ios')
    expect(detectInstallPlatform({ userAgent: MAC, maxTouchPoints: 5 }, false)).toBe('ios')
  })

  it('Android y Mac de escritorio usan el aviso nativo', () => {
    expect(detectInstallPlatform({ userAgent: ANDROID, maxTouchPoints: 5 }, false)).toBe('other')
    expect(detectInstallPlatform({ userAgent: MAC, maxTouchPoints: 0 }, false)).toBe('other')
  })
})
