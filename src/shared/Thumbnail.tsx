import { FileText } from 'lucide-react'
import { useObjectUrl } from './useObjectUrl'

interface ThumbnailProps {
  blob?: Blob
  className?: string
}

export function Thumbnail({ blob, className = 'h-16 w-12' }: ThumbnailProps) {
  const url = useObjectUrl(blob)

  if (!url) {
    return (
      <div className={`${className} flex shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 ring-1 ring-slate-200`}>
        <FileText size={20} />
      </div>
    )
  }

  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      decoding="async"
      className={`${className} shrink-0 rounded-lg bg-white object-cover ring-1 ring-slate-900/10`}
    />
  )
}
