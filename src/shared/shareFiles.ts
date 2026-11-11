export function canShareFiles(files: File[]): boolean {
  return typeof navigator.canShare === 'function' && navigator.canShare({ files })
}

/**
 * Abre el menú de compartir del sistema. Debe llamarse dentro de un gesto del usuario (clic).
 * Devuelve false si el usuario canceló.
 */
export async function shareFiles(files: File[], title: string): Promise<boolean> {
  try {
    await navigator.share({ files, title })
    return true
  } catch (error) {
    if ((error as DOMException).name === 'AbortError') return false
    throw error
  }
}

export function downloadFile(file: File): void {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
