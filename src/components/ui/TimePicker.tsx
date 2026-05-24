import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value?: string; // HH:mm format
  onChange: (time: string) => void;
  label?: string;
}

export function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverCoords, setPopoverCoords] = useState<{ top: number, left: number, width: number } | null>(null);
  
  // Parse value or default to current time
  const now = new Date();
  const initialParts = value ? value.split(':') : null;
  const initialHours = initialParts ? parseInt(initialParts[0]) : now.getHours();
  const initialMinutes = initialParts ? parseInt(initialParts[1]) : now.getMinutes();
  
  // Convert to 12-hour format
  const [hours, setHours] = useState(() => {
    return initialHours === 0 ? '12' : initialHours > 12 ? (initialHours - 12).toString().padStart(2, '0') : initialHours.toString().padStart(2, '0');
  });
  const [minutes, setMinutes] = useState(initialMinutes.toString().padStart(2, '0'));
  const [isPM, setIsPM] = useState(initialHours >= 12);

  const modalRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const parts = value.split(':');
      if (parts.length === 2) {
        const h = parseInt(parts[0]);
        setIsPM(h >= 12);
        setHours(h === 0 ? '12' : h > 12 ? (h - 12).toString().padStart(2, '0') : h.toString().padStart(2, '0'));
        setMinutes(parseInt(parts[1]).toString().padStart(2, '0'));
      }
    }
  }, [value]);

  const updatePopoverPosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const popoverHeight = 220;
      const spaceBelow = window.innerHeight - rect.bottom;
      
      if (spaceBelow < popoverHeight && rect.top > popoverHeight) {
        setPopoverCoords({
          top: rect.top - 8 - popoverHeight,
          left: rect.left,
          width: Math.max(rect.width, 280)
        });
      } else {
        setPopoverCoords({
          top: rect.bottom + 8,
          left: rect.left,
          width: Math.max(rect.width, 280)
        });
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isInsideContainer = containerRef.current?.contains(event.target as Node);
      const isInsideModal = modalRef.current?.contains(event.target as Node);
      if (!isInsideContainer && !isInsideModal) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      updatePopoverPosition();
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', updatePopoverPosition, true);
      window.addEventListener('resize', updatePopoverPosition);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePopoverPosition, true);
      window.removeEventListener('resize', updatePopoverPosition);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePopoverPosition, true);
      window.removeEventListener('resize', updatePopoverPosition);
    };
  }, [isOpen]);

  const handleConfirm = () => {
    let hour24 = parseInt(hours || '0');
    // Convert from 12-hour to 24-hour format
    if (isPM && hour24 !== 12) {
      hour24 += 12;
    } else if (!isPM && hour24 === 12) {
      hour24 = 0;
    }
    const timeString = `${hour24.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    onChange(timeString);
    setIsOpen(false);
  };

  const handleNow = () => {
    const now = new Date();
    setIsPM(now.getHours() >= 12);
    setHours(now.getHours() === 0 ? '12' : now.getHours() > 12 ? (now.getHours() - 12).toString().padStart(2, '0') : now.getHours().toString().padStart(2, '0'));
    setMinutes(now.getMinutes().toString().padStart(2, '0'));
  };

  const handleClear = () => {
    setHours('12');
    setMinutes('00');
    setIsPM(false);
    onChange('');
    setIsOpen(false);
  };

  // Format display time in 12-hour format
  const displayTime = value ? (() => {
    const parts = value.split(':');
    if (parts.length === 2) {
      const h = parseInt(parts[0]);
      const m = parts[1];
      const displayHour = h === 0 ? '12' : h > 12 ? (h - 12).toString() : h.toString();
      const ampm = h >= 12 ? 'PM' : 'AM';
      return `${displayHour}:${m} ${ampm}`;
    }
    return value;
  })() : '';

  return (
    <div className="group flex flex-col gap-1 w-full" ref={containerRef}>
      <div 
        className={cn(
          "flex flex-col justify-center rounded-[18px] bg-[var(--bg-surface)] px-4 py-2 border transition-all duration-200",
          "border-[var(--border-default)]",
          isOpen ? "border-[var(--color-brand)] ring-4 ring-[var(--color-brand-subtle)]" : "hover:border-[var(--border-strong)]",
        )}
      >
        {label && (
          <span
            className="text-[9px] font-black text-[var(--text-muted)] tracking-widest uppercase mb-0.5 transition-colors select-none group-focus-within:text-[var(--color-brand)]"
          >
            {label}
          </span>
        )}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-transparent text-left outline-none border-none p-0 h-6"
        >
          <span className={cn(
            "text-[var(--text-sm)] tracking-wide",
            !value ? "text-white/20" : "text-[var(--text-primary)] font-semibold"
          )}>
            {displayTime || 'Select time'}
          </span>
          <Clock className={cn(
            "w-4 h-4 transition-all duration-300",
            isOpen ? "text-[var(--color-brand)] scale-110" : "text-[var(--text-muted)] group-hover:text-[var(--color-brand)]"
          )} />
        </button>
      </div>

      {isOpen && popoverCoords && createPortal(
        <div 
          style={{ 
            position: 'fixed', 
            top: `${popoverCoords.top}px`, 
            left: `${popoverCoords.left}px`, 
            width: `${popoverCoords.width}px`,
            zIndex: 9999 
          }}
          className="animate-in fade-in zoom-in-95 duration-300 origin-top pointer-events-none"
        >
          <div 
            ref={modalRef}
            className="w-full max-w-[280px] mx-auto bg-[var(--bg-raised)] rounded-2xl shadow-2xl overflow-hidden border border-[var(--border-strong)] p-5 pointer-events-auto backdrop-blur-xl bg-opacity-95"
          >
            {/* Time Input Section */}
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} className="text-[var(--color-brand)]" />
              <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Set Time</span>
            </div>
            
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex items-center bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden p-1">
                <input 
                  type="text" 
                  value={hours} 
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                    if (parseInt(val) <= 12 || val === '') {
                      setHours(val);
                    }
                  }}
                  onBlur={() => setHours(h => {
                    if (h === '' || h === '0') return '12';
                    return h.padStart(2, '0');
                  })}
                  className="w-14 h-12 text-center bg-transparent outline-none font-bold text-[var(--text-primary)] text-xl"
                  placeholder="HH"
                />
                <span className="text-[var(--text-muted)] font-bold text-xl px-1">:</span>
                <input 
                  type="text" 
                  value={minutes} 
                  onChange={(e) => setMinutes(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  onBlur={() => setMinutes(m => m.padStart(2, '0'))}
                  className="w-12 h-12 text-center bg-transparent outline-none font-bold text-[var(--text-primary)] text-xl"
                  placeholder="MM"
                />
              </div>
              
              {/* AM/PM Toggle */}
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setIsPM(false)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-bold transition-all",
                    !isPM 
                      ? "bg-[var(--color-brand)] text-white shadow-md" 
                      : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-white/10"
                  )}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setIsPM(true)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-bold transition-all",
                    isPM 
                      ? "bg-[var(--color-brand)] text-white shadow-md" 
                      : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-white/10"
                  )}
                >
                  PM
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-2 mb-3">
              <Button 
                type="button" 
                onClick={handleConfirm}
                className="h-10 px-6 rounded-xl font-bold shadow-lg"
              >
                Set
              </Button>
            </div>
            
            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
              <button 
                type="button" 
                onClick={handleClear}
                className="text-[11px] font-bold text-[var(--color-brand)] hover:opacity-70 px-3 py-1.5 transition-opacity"
              >
                Clear
              </button>
              <button 
                type="button" 
                onClick={handleNow}
                className="text-[11px] font-bold text-[var(--color-brand)] hover:opacity-70 px-3 py-1.5 transition-opacity"
              >
                Now
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}