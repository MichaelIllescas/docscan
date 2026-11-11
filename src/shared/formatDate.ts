const formatter = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' })

export function formatDate(timestamp: number): string {
  return formatter.format(timestamp)
}

export function pagesLabel(count: number): string {
  return count === 1 ? '1 página' : `${count} páginas`
}
