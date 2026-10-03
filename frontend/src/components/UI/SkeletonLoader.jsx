import PropTypes from 'prop-types'

export function SkeletonLine({ className = '' }) {
  return <div className={`animate-pulse rounded bg-border/60 ${className}`} />
}

export function PostmortemSkeleton() {
  return (
    <div className="card space-y-6" aria-hidden="true">
      <SkeletonLine className="h-6 w-28 rounded-md" />
      <SkeletonLine className="h-7 w-3/4" />
      <div className="flex gap-2">
        <SkeletonLine className="h-9 w-20 rounded-lg" />
        <SkeletonLine className="h-9 w-28 rounded-lg" />
      </div>
      <div className="space-y-2 pt-4">
        <SkeletonLine className="h-5 w-40" />
        <SkeletonLine className="h-4 w-full" />
        <SkeletonLine className="h-4 w-5/6" />
      </div>
      <div className="space-y-3 pt-2">
        <SkeletonLine className="h-5 w-28" />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={`skeleton-${i}`} className="flex gap-4">
            <SkeletonLine className="h-7 w-7 rounded-full" />
            <SkeletonLine className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  )
}

SkeletonLine.propTypes = {
  className: PropTypes.string,
}
