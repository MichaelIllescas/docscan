export type InstallPlatform = 'installed' | 'ios' | 'other'

interface NavigatorInfo {
  userAgent: string
  maxTouchPoints: number
  standalone?: boolean
}

/** Decide qué invitación a instalar mostrar. Separado del DOM para poder testearlo. */
export function detectInstallPlatform(nav: NavigatorInfo, isStandaloneDisplay: boolean): InstallPlatform {
  if (isStandaloneDisplay || nav.standalone) return 'installed'
  const ua = nav.userAgent
  // iPadOS se presenta como Mac con pantalla táctil.
  const isIos = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && nav.maxTouchPoints > 1)
  return isIos ? 'ios' : 'other'
}
