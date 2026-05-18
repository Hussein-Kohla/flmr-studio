import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'muted'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  dot?: boolean
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--bg-surface)]  text-[var(--text-secondary)] border-[var(--border-subtle)]',
  brand:   'bg-[var(--color-brand-subtle)] text-[var(--color-brand)]  border-[var(--color-brand)]/20',
  success: 'bg-[var(--color-success-subtle)] text-[var(--color-success)] border-[var(--color-success)]/20',
  warning: 'bg-[var(--color-warning-subtle)] text-[var(--color-warning)] border-[var(--color-warning)]/20',
  danger:  'bg-[var(--color-danger-subtle)]  text-[var(--color-danger)]  border-[var(--color-danger)]/20',
  info:    'bg-[var(--color-info-subtle)]    text-[var(--color-info)]    border-[var(--color-info)]/20',
  muted:   'bg-[var(--bg-muted)] text-[var(--text-muted)] border-transparent',
}

export function Badge({ variant = 'default', dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--radius-full)]',
        'text-[var(--text-xs)] font-medium border',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
      )}
      {children}
    </span>
  )
}
