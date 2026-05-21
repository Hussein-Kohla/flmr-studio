import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className, children, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="group flex flex-col gap-1 w-full">
        <div 
          className={cn(
            "flex flex-col justify-center rounded-[18px] bg-[var(--bg-surface)] px-4 py-2 border transition-all duration-200",
            "border-[var(--border-default)]",
            "focus-within:border-[var(--color-brand)] focus-within:ring-4 focus-within:ring-[var(--color-brand-subtle)]",
            "hover:border-[var(--border-strong)]",
            error && "border-[var(--color-danger)] focus-within:border-[var(--color-danger)] focus-within:ring-[var(--color-danger-subtle)]",
            props.disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          {label && (
            <label
              htmlFor={selectId}
              className="text-[9px] font-black text-[var(--text-muted)] tracking-widest uppercase mb-0.5 transition-colors select-none group-focus-within:text-[var(--color-brand)]"
            >
              {label}
            </label>
          )}
          <div className="relative flex items-center w-full">
            <select
              ref={ref}
              id={selectId}
              className="w-full bg-transparent border-none text-[var(--text-sm)] text-[var(--text-primary)] outline-none p-0 h-6 appearance-none cursor-pointer pr-8"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0 center',
                backgroundRepeat: 'no-repeat',
              }}
              {...props}
            >
              {children}
            </select>
          </div>
        </div>
        {error && (
          <p className="text-[var(--color-danger)] text-[10px] font-bold ml-2 mt-0.5">{error}</p>
        )}
        {!error && hint && (
          <p className="text-[var(--text-muted)] text-[10px] font-medium ml-2 mt-0.5">{hint}</p>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'
