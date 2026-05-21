import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="group flex flex-col gap-1 w-full">
        <div 
          className={cn(
            "flex flex-col justify-start rounded-[18px] bg-[var(--bg-surface)] px-4 py-2 border transition-all duration-200",
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
              htmlFor={textareaId}
              className="text-[9px] font-black text-[var(--text-muted)] tracking-widest uppercase mb-0.5 transition-colors select-none group-focus-within:text-[var(--color-brand)]"
            >
              {label}
            </label>
          )}
          <textarea
            ref={ref}
            id={textareaId}
            className="w-full bg-transparent border-none text-[var(--text-sm)] text-[var(--text-primary)] placeholder:text-white/20 outline-none p-0 min-h-[80px] resize-none"
            {...props}
          />
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
Textarea.displayName = 'Textarea'
