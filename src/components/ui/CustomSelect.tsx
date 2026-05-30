import React, { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CustomSelectOption {
  label: ReactNode;
  value: string | number;
}

export interface CustomSelectProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
  dropdownClassName?: string;
  disabled?: boolean;
  error?: boolean;
  icon?: ReactNode;
  label?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  className,
  dropdownClassName,
  disabled = false,
  error = false,
  icon,
  label,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {label && (
        <label className="text-[9px] font-black text-[var(--text-muted)] tracking-widest uppercase mb-0.5 transition-colors select-none block">
          {label}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-bold shadow-sm outline-none",
          disabled ? "opacity-50 cursor-not-allowed bg-[var(--bg-muted)] border-[var(--border-default)]" : "cursor-pointer bg-[var(--bg-surface)] hover:border-[var(--color-brand)]",
          isOpen ? "border-[var(--color-brand)] ring-2 ring-[var(--color-brand-subtle)]" : "border-[var(--border-default)]",
          error && "border-[var(--color-danger)] text-[var(--color-danger)]",
          !disabled && !isOpen && !error && "hover:border-[var(--border-strong)]"
        )}
      >
        <div className="flex items-center gap-2 flex-1 truncate">
          {icon && <span className="text-[var(--text-muted)] shrink-0">{icon}</span>}
          <span className={cn("truncate", !selectedOption && "text-[var(--text-muted)]")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown 
          size={16} 
          className={cn(
            "text-[var(--text-muted)] transition-transform duration-200 shrink-0", 
            isOpen && "rotate-180 text-[var(--color-brand)]"
          )} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -5, scaleY: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute z-50 w-full mt-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl overflow-hidden origin-top max-h-[300px] overflow-y-auto custom-scrollbar",
              dropdownClassName
            )}
          >
            <div className="p-1.5 flex flex-col gap-0.5">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-sm text-[var(--text-muted)] text-center font-bold">
                  لا توجد خيارات
                </div>
              ) : (
                options.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <button
                      type="button"
                      key={String(option.value)}
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold transition-colors",
                        isSelected 
                          ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]" 
                          : "text-white hover:bg-[var(--bg-muted)]"
                      )}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected && <Check size={16} className="text-[var(--color-brand)] shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
