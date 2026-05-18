import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string
  height?: string
  circle?: boolean
}

export function Skeleton({ width, height, circle, className, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton', circle && 'rounded-full', className)}
      style={{ width, height, borderRadius: circle ? '50%' : undefined, ...style }}
      aria-hidden="true"
      {...props}
    />
  )
}

/** Pre-built card skeleton */
export function CardSkeleton() {
  return (
    <div className="rounded-[var(--radius-xl)] bg-[var(--bg-raised)] border border-[var(--border-subtle)] p-6 space-y-3">
      <Skeleton height="20px" width="60%" />
      <Skeleton height="14px" width="40%" />
      <div className="pt-2 space-y-2">
        <Skeleton height="12px" />
        <Skeleton height="12px" width="80%" />
      </div>
    </div>
  )
}

/** Pre-built table row skeleton */
export function RowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton circle width="36px" height="36px" />
          <div className="flex-1 space-y-2">
            <Skeleton height="14px" width="50%" />
            <Skeleton height="12px" width="30%" />
          </div>
          <Skeleton height="24px" width="64px" />
        </div>
      ))}
    </div>
  )
}
