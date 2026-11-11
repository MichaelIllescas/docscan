import { RefreshCw } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md animate-pop-in items-center gap-3 rounded-2xl bg-slate-900 p-3 pl-4 text-sm text-white shadow-2xl"
    >
      <RefreshCw size={18} className="shrink-0 text-sky-300" />
      <span className="min-w-0 flex-1">Hay una nueva versión disponible.</span>
      <button className="px-2 py-1.5 text-slate-300" onClick={() => setNeedRefresh(false)}>
        Luego
      </button>
      <button className="rounded-xl bg-brand-600 px-3 py-1.5 font-semibold" onClick={() => updateServiceWorker(true)}>
        Actualizar
      </button>
    </div>
  )
}
