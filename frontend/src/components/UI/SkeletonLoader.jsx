import PropTypes from 'prop-types'

export function SkeletonLine({ className = '' }) {
  return <div className={`bg-border/50 rounded animate-pulse ${className}`} />
}

export function PostmortemSkeleton() {
  return (
    <div className="card space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <SkeletonLine className="h-6 w-64" />
        <SkeletonLine className="h-6 w-16 rounded-full" />
      </div>
      <SkeletonLine className="h-4 w-full" />
      <SkeletonLine className="h-4 w-3/4" />
      <div className="space-y-2 mt-4">
        <SkeletonLine className="h-5 w-32" />
        {[...new Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <SkeletonLine className="h-4 w-16" />
            <SkeletonLine className="h-4 flex-1" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <SkeletonLine className="h-5 w-40" />
        <SkeletonLine className="h-4 w-full" />
        <SkeletonLine className="h-4 w-5/6" />
        <SkeletonLine className="h-4 w-4/5" />
      </div>
    </div>
  )
}

SkeletonLine.propTypes = {
  className: PropTypes.string,
}

SkeletonLine.defaultProps = {
  className: '',
}
