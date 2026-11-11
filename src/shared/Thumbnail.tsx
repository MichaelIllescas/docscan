import { useObjectUrl } from './useObjectUrl'

interface ThumbnailProps {
  blob?: Blob
  className?: string
}

export function Thumbnail({ blob, className = 'h-14 w-11' }: ThumbnailProps) {
  const url = useObjectUrl(blob)

  if (!url) {
    return (
      <div className={`${className} flex shrink-0 items-center justify-center rounded-md bg-slate-200 text-xs text-slate-500`}>
        PDF
      </div>
    )
  }

  return <img src={url} alt="" className={`${className} shrink-0 rounded-md bg-white object-cover shadow-sm`} />
}
