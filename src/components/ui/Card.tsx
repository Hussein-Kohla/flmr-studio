import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean
  hoverable?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingStyles = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
}

export function Card({ glass, hoverable, padding = 'md', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-xl)] border border-[var(--border-subtle)]',
        glass
          ? 'bg-[var(--glass-bg)] backdrop-blur-[16px] border-[var(--glass-border)]'
          : 'bg-[var(--bg-raised)]',
        hoverable && 'transition-all duration-200 hover:scale-[1.02] hover:border-[var(--border-default)] hover:shadow-[var(--shadow-md)] cursor-pointer',
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-[var(--text-xl)] font-semibold text-[var(--text-primary)]', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('text-[var(--text-secondary)] text-[var(--text-sm)]', className)} {...props}>
      {children}
    </div>
  )
}
