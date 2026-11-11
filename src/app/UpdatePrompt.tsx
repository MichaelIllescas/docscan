import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 flex items-center justify-between gap-3 rounded-xl bg-slate-900 p-4 text-sm text-white shadow-lg">
      <span>Hay una nueva versión disponible.</span>
      <div className="flex gap-2">
        <button className="px-2 py-1 text-slate-300" onClick={() => setNeedRefresh(false)}>
          Luego
        </button>
        <button className="rounded-lg bg-blue-600 px-3 py-1 font-medium" onClick={() => updateServiceWorker(true)}>
          Actualizar
        </button>
      </div>
    </div>
  )
}
