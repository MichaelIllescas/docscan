import { Download, Share, SquarePlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { detectInstallPlatform } from './installPlatform'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'docscan.installDismissed'

// Chrome puede disparar el evento antes de que React monte el componente: se captura al cargar el módulo.
let earlyPrompt: BeforeInstallPromptEvent | null = null
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  earlyPrompt = e as BeforeInstallPromptEvent
})

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

function rememberDismissed(): void {
  try {
    localStorage.setItem(DISMISSED_KEY, '1')
  } catch {
    /* sin almacenamiento: se volverá a mostrar */
  }
}

/**
 * Invitación a instalar la app. En Android/Chrome usa el diálogo nativo (`beforeinstallprompt`);
 * en iPhone/iPad, que no tienen aviso nativo, muestra cómo agregarla a inicio.
 */
export function InstallPrompt() {
  const [platform] = useState(() =>
    detectInstallPlatform(
      navigator as Navigator & { standalone?: boolean },
      window.matchMedia('(display-mode: standalone)').matches,
    ),
  )
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(() => earlyPrompt)
  const [hidden, setHidden] = useState(wasDismissed)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setHidden(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (hidden || platform === 'installed') return null
  if (platform !== 'ios' && !deferred) return null

  function dismiss() {
    rememberDismissed()
    setHidden(true)
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    earlyPrompt = null
    setDeferred(null)
    if (outcome === 'accepted') setHidden(true)
  }

  return (
    <div
      role="dialog"
      aria-label="Instalar DocScan"
      className="relative mx-4 mt-4 flex animate-pop-in items-start gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-brand-100"
    >
      <button
        onClick={dismiss}
        aria-label="Cerrar"
        className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 active:bg-slate-100"
      >
        <X size={16} />
      </button>
      <img src="/pwa-64x64.png" alt="" className="h-11 w-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 pr-6 text-sm">
        <p className="font-semibold text-slate-900">Instalá DocScan</p>
        {platform === 'ios' ? (
          <p className="mt-0.5 text-slate-500">
            Tocá <Share size={14} className="inline -translate-y-px text-brand-600" aria-label="Compartir" /> y después{' '}
            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
              <SquarePlus size={14} className="text-brand-600" /> Agregar a inicio
            </span>
          </p>
        ) : (
          <>
            <p className="mt-0.5 text-slate-500">Abrila desde tu pantalla de inicio, también sin conexión.</p>
            <button
              onClick={install}
              className="mt-3 flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white active:bg-brand-700"
            >
              <Download size={16} />
              Instalar app
            </button>
          </>
        )}
      </div>
    </div>
  )
}
