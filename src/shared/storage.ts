/**
 * Pide al navegador que no borre los datos de la app ante falta de espacio
 * (en iOS, además, evita el borrado por inactividad). Se llama al guardar el primer documento.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export interface StorageInfo {
  usage: number
  quota: number
  persisted: boolean
}

export async function getStorageInfo(): Promise<StorageInfo | null> {
  try {
    if (!navigator.storage?.estimate) return null
    const [{ usage = 0, quota = 0 }, persisted] = await Promise.all([
      navigator.storage.estimate(),
      navigator.storage.persisted?.() ?? Promise.resolve(false),
    ])
    return { usage, quota, persisted }
  } catch {
    return null
  }
}
