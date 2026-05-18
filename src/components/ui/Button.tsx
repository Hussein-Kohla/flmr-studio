import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantStyles: Record<Variant, string> = {
  primary:   'bg-[var(--color-brand)] text-white hover:brightness-110 shadow-[0_0_20px_var(--color-brand-glow)] hover:shadow-[0_0_32px_var(--color-brand-glow)]',
  secondary: 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-muted)]',
  ghost:     'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]',
  danger:    'bg-[var(--color-danger)] text-white hover:brightness-110 shadow-[0_0_20px_var(--color-danger-subtle)]',
  outline:   'bg-transparent border border-[var(--color-brand)] text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)]',
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-8  px-3   text-[var(--text-sm)]  gap-1.5 rounded-[var(--radius-md)]',
  md: 'h-10 px-4   text-[var(--text-base)] gap-2  rounded-[var(--radius-md)]',
  lg: 'h-12 px-6   text-[var(--text-lg)]  gap-2.5 rounded-[var(--radius-lg)]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled ?? loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200',
        'select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        'active:scale-95',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
)
Button.displayName = 'Button'
