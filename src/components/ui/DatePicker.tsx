import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronUp, ChevronDown, Clock } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value: string; // ISO string or YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  withTime?: boolean;
  placeholder?: string;
}

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function DatePicker({ value, onChange, label, withTime = false, placeholder = "Select date" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverCoords, setPopoverCoords] = useState<{ top: number, left: number, width: number } | null>(null);
  
  // Parse incoming value or default to now
  const initialDate = value ? new Date(value) : new Date();
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  
  // For time selection
  const [hours, setHours] = useState(initialDate.getHours().toString().padStart(2, '0'));
  const [minutes, setMinutes] = useState(initialDate.getMinutes().toString().padStart(2, '0'));

  const modalRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setSelectedDate(d);
        setViewMonth(d.getMonth());
        setViewYear(d.getFullYear());
        setHours(d.getHours().toString().padStart(2, '0'));
        setMinutes(d.getMinutes().toString().padStart(2, '0'));
      }
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const updatePopoverPosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const popoverHeight = withTime ? 450 : 380;
      const spaceBelow = window.innerHeight - rect.bottom;
      
      if (spaceBelow < popoverHeight && rect.top > popoverHeight) {
        setPopoverCoords({
          top: rect.top - 8 - popoverHeight,
          left: rect.left,
          width: Math.max(rect.width, 320)
        });
      } else {
        setPopoverCoords({
          top: rect.bottom + 8,
          left: rect.left,
          width: Math.max(rect.width, 320)
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

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const days = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, currentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, currentMonth: true });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, currentMonth: false });
  }

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleDaySelect = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day);
    newDate.setHours(parseInt(hours));
    newDate.setMinutes(parseInt(minutes));
    setSelectedDate(newDate);
    
    if (!withTime) {
      const tzoffset = newDate.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(newDate.getTime() - tzoffset)).toISOString().slice(0, 10);
      onChange(localISOTime);
      setIsOpen(false);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setViewMonth(today.getMonth());
    setViewYear(today.getFullYear());
    setHours(today.getHours().toString().padStart(2, '0'));
    setMinutes(today.getMinutes().toString().padStart(2, '0'));
    
    if (!withTime) {
      const tzoffset = today.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(today.getTime() - tzoffset)).toISOString().slice(0, 10);
      onChange(localISOTime);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setSelectedDate(null);
    onChange("");
    setIsOpen(false);
  };

  const handleTimeConfirm = () => {
    if (selectedDate) {
      const finalDate = new Date(selectedDate);
      finalDate.setHours(parseInt(hours));
      finalDate.setMinutes(parseInt(minutes));
      
      const tzoffset = finalDate.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(finalDate.getTime() - tzoffset)).toISOString().slice(0, 16);
      onChange(localISOTime);
      setIsOpen(false);
    }
  };

  const formattedDisplay = selectedDate ? selectedDate.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  }) + (withTime ? ` ${selectedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}` : '') : "";

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && <label className="form-label">{label}</label>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between bg-[var(--bg-surface)] rounded-2xl border transition-all duration-300 px-5 py-3.5 text-left group",
          isOpen ? "border-[var(--color-brand)] ring-4 ring-[var(--color-brand-glow)] shadow-brand" : "border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-muted)]"
        )}
      >
        <span className={cn(
          "flex-1 text-sm tracking-wide",
          !selectedDate ? "text-[var(--text-muted)]" : "text-[var(--text-primary)] font-semibold"
        )}>
          {selectedDate ? formattedDisplay : placeholder}
        </span>
        <CalendarIcon className={cn(
          "w-5 h-5 transition-all duration-300",
          isOpen ? "text-[var(--color-brand)] scale-110" : "text-[var(--text-muted)] group-hover:text-[var(--color-brand)]"
        )} />
      </button>

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
            className="w-full max-w-[320px] mx-auto bg-[var(--bg-raised)] rounded-2xl shadow-2xl overflow-hidden border border-[var(--border-strong)] p-5 pointer-events-auto backdrop-blur-xl bg-opacity-95"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <button 
                type="button"
                onClick={() => {}} // Could add year/month picker here
                className="flex items-center gap-2 font-bold text-[var(--text-primary)] hover:text-[var(--color-brand)] transition-colors text-base"
              >
                {MONTHS[viewMonth]} {viewYear}
                <ChevronDown size={14} className="opacity-40" />
              </button>
              <div className="flex items-center gap-1">
                <button 
                  type="button" 
                  onClick={handlePrevMonth} 
                  className="p-2 rounded-xl hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
                >
                  <ChevronUp size={16} />
                </button>
                <button 
                  type="button" 
                  onClick={handleNextMonth} 
                  className="p-2 rounded-xl hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS_SHORT.map((day, i) => (
                <div key={i} className="text-center text-[10px] font-black text-[var(--text-muted)] h-8 flex items-center justify-center uppercase tracking-widest">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((item, i) => {
                const isSelected = selectedDate && 
                                  item.day === selectedDate.getDate() && 
                                  viewMonth === selectedDate.getMonth() && 
                                  viewYear === selectedDate.getFullYear() &&
                                  item.currentMonth;
                
                const isToday = item.day === new Date().getDate() && 
                                viewMonth === new Date().getMonth() && 
                                viewYear === new Date().getFullYear() &&
                                item.currentMonth;
                
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => item.currentMonth && handleDaySelect(item.day)}
                    className={cn(
                      "h-9 w-full rounded-xl flex items-center justify-center text-xs transition-all duration-200 relative group",
                      !item.currentMonth && "text-[var(--text-disabled)] pointer-events-none opacity-40",
                      item.currentMonth && !isSelected && "text-[var(--text-primary)] hover:bg-[var(--color-brand-subtle)] hover:text-[var(--color-brand)]",
                      isSelected && "bg-[var(--color-brand)] text-white font-bold shadow-brand",
                      isToday && !isSelected && "after:content-[''] after:absolute after:bottom-1.5 after:w-1 after:h-1 after:bg-[var(--color-brand)] after:rounded-full"
                    )}
                  >
                    {item.day}
                  </button>
                );
              })}
            </div>

            {/* Time Selection */}
            {withTime && (
              <div className="mt-6 pt-5 border-t border-[var(--border-subtle)] flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-[var(--color-brand)]" />
                  <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Set Time</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden p-1">
                    <input 
                      type="text" 
                      value={hours} 
                      onChange={(e) => setHours(e.target.value.replace(/\D/g, '').slice(0, 2))}
                      onBlur={() => setHours(h => h.padStart(2, '0'))}
                      className="w-12 h-10 text-center bg-transparent outline-none font-bold text-[var(--text-primary)] text-lg"
                    />
                    <span className="text-[var(--text-muted)] font-bold text-lg">:</span>
                    <input 
                      type="text" 
                      value={minutes} 
                      onChange={(e) => setMinutes(e.target.value.replace(/\D/g, '').slice(0, 2))}
                      onBlur={() => setMinutes(m => m.padStart(2, '0'))}
                      className="w-12 h-10 text-center bg-transparent outline-none font-bold text-[var(--text-primary)] text-lg"
                    />
                  </div>
                  <Button 
                    type="button" 
                    onClick={handleTimeConfirm}
                    className="h-12 px-6 rounded-xl font-bold shadow-lg"
                    disabled={!selectedDate}
                  >
                    Set
                  </Button>
                </div>
              </div>
            )}
            
            {/* Footer Actions */}
            <div className="flex items-center justify-between mt-6 pt-2 border-t border-[var(--border-subtle)]">
              <button 
                type="button" 
                onClick={handleClear}
                className="text-[11px] font-bold text-[var(--color-brand)] hover:opacity-70 px-3 py-1.5 transition-opacity"
              >
                Clear
              </button>
              <button 
                type="button" 
                onClick={handleToday}
                className="text-[11px] font-bold text-[var(--color-brand)] hover:opacity-70 px-3 py-1.5 transition-opacity"
              >
                Today
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
