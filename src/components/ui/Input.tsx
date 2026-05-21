import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  variant?: 'default' | 'minimal'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, variant = 'default', className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="group flex flex-col gap-1 w-full relative">
        <div 
          className={cn(
            "flex flex-col justify-center px-4 py-2 transition-all duration-200",
            variant === 'default' && [
              "rounded-[18px] bg-[var(--bg-surface)] border",
              "border-[var(--border-default)]",
              "focus-within:border-[var(--color-brand)] focus-within:ring-4 focus-within:ring-[var(--color-brand-subtle)]",
              "hover:border-[var(--border-strong)]",
              error && "border-[var(--color-danger)] focus-within:border-[var(--color-danger)] focus-within:ring-[var(--color-danger-subtle)]"
            ],
            variant === 'minimal' && [
              "bg-transparent border-b-2 border-[var(--border-default)] rounded-none px-0 py-3",
              "focus-within:border-[var(--color-brand)]",
              "hover:border-[var(--border-strong)]",
              error && "border-[var(--color-danger)] focus-within:border-[var(--color-danger)]"
            ],
            props.disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                "text-[9px] font-black text-[var(--text-muted)] tracking-widest uppercase mb-0.5 transition-colors select-none group-focus-within:text-[var(--color-brand)]",
                variant === 'minimal' && "text-[11px] mb-1"
              )}
            >
              {label}
            </label>
          )}
          <div className="relative flex items-center w-full">
            {leftIcon && (
              <span className="absolute left-0 text-[var(--text-muted)] pointer-events-none pr-2 shrink-0">
                {leftIcon}
              </span>
            )}
            <input
              ref={ref}
              id={inputId}
              className={cn(
                "w-full bg-transparent border-none text-[var(--text-sm)] text-[var(--text-primary)] placeholder:text-white/30 outline-none p-0 h-6 focus:ring-0",
                leftIcon ? "pl-7" : "pl-0",
                rightIcon ? "pr-7" : "pr-0",
                variant === 'minimal' && "text-[15px]"
              )}
              {...props}
            />
            {rightIcon && (
              <span className="absolute right-0 text-[var(--text-muted)] pointer-events-none pl-2 shrink-0">
                {rightIcon}
              </span>
            )}
          </div>
        </div>
        {error && (
          <p className="text-[var(--color-danger)] text-[10px] font-bold mt-0.5">{error}</p>
        )}
        {!error && hint && (
          <p className="text-[var(--text-muted)] text-[10px] font-medium mt-0.5">{hint}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
