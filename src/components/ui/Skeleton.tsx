interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

export function SkeletonText({ className = '' }: SkeletonProps) {
  return <Skeleton className={`h-3 ${className}`} />
}

interface SkeletonTableRowsProps {
  rows?: number
  cols?: number
  cellClassName?: string
}

export function SkeletonTableRows({ rows = 5, cols = 6, cellClassName = '' }: SkeletonTableRowsProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-gray-100">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className={`px-3 py-3 ${cellClassName}`}>
              <Skeleton className="h-3 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

interface SkeletonCardsProps {
  count?: number
  className?: string
}

export function SkeletonCards({ count = 4, className = '' }: SkeletonCardsProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`border border-gray-200 rounded-xl p-4 ${className}`}>
          <Skeleton className="h-3 w-2/3 mb-3" />
          <Skeleton className="h-6 w-1/2 mb-2" />
          <Skeleton className="h-2 w-full" />
        </div>
      ))}
    </>
  )
}
