import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  onBlur?: (e: React.FocusEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function AutocompleteInput({
  value,
  onChange,
  options,
  placeholder,
  className,
  onBlur,
  onKeyDown,
}: AutocompleteInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(
    (o) =>
      o.toLowerCase().includes((value || '').toLowerCase()) &&
      o.toLowerCase() !== (value || '').toLowerCase()
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    onChange(option);
    setShowOptions(false);
  };

  return (
    <div ref={wrapperRef} className={cn('relative group', className)}>
      <AnimatePresence>
        {isFocused && placeholder && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs text-[var(--color-brand)] px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-20 pointer-events-none font-bold"
          >
            {placeholder}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--bg-surface)] border-b border-r border-[var(--border-default)] rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowOptions(true);
        }}
        onFocus={() => {
          setIsFocused(true);
          setShowOptions(true);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          setTimeout(() => {
            if (onBlur) onBlur(e);
            setShowOptions(false);
          }, 200);
        }}
        onKeyDown={onKeyDown}
        placeholder={isFocused ? '' : placeholder}
        className={cn(
          'w-full bg-black/20 border border-white/10 hover:border-white/30 focus:bg-black/30 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--color-brand)] transition-colors text-white shadow-sm placeholder:text-white/20'
        )}
      />

      {showOptions && filteredOptions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-1">
          {filteredOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(opt);
              }}
              className="w-full text-right px-3 py-2 text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--color-brand)] hover:text-white rounded-lg transition-colors"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
