import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Calculator, X, ZoomIn, ZoomOut } from 'lucide-react';
import { APP_ZOOM_MAX, APP_ZOOM_MIN, useSettings } from '@/hooks/useSettings';

export function ToolHelper({ isSidebarOpen }: { isSidebarOpen?: boolean }) {
  const { t, zoom, zoomIn, zoomOut } = useSettings();
  const [open, setOpen] = useState(false);
  const zoomPercent = Math.round(zoom * 100);
  const canZoomOut = zoom > APP_ZOOM_MIN + 0.001;
  const canZoomIn = zoom < APP_ZOOM_MAX - 0.001;
  const [displayValue, setDisplayValue] = useState('0');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);
  const dragControls = useDragControls();

  const calculate = (a: number, b: number, op: string) => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b === 0 ? 0 : a / b;
      default: return b;
    }
  };

  const handleNum = (num: string) => {
    if (waitingForNewValue) {
      setDisplayValue(num);
      setWaitingForNewValue(false);
    } else {
      setDisplayValue(displayValue === '0' ? num : displayValue + num);
    }
  };

  const handleOp = (op: string) => {
    if (operator && !waitingForNewValue && previousValue !== null) {
      const result = calculate(parseFloat(previousValue), parseFloat(displayValue), operator);
      setDisplayValue(String(result));
      setPreviousValue(String(result));
    } else {
      setPreviousValue(displayValue);
    }
    setOperator(op);
    setWaitingForNewValue(true);
  };

  const handleEqual = () => {
    if (operator && previousValue !== null) {
      const result = calculate(parseFloat(previousValue), parseFloat(displayValue), operator);
      setDisplayValue(String(result));
      setPreviousValue(null);
      setOperator(null);
      setWaitingForNewValue(true);
    }
  };

  const handleClear = () => {
    setDisplayValue('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForNewValue(false);
  };

  const handleToggleSign = () => {
    setDisplayValue(String(parseFloat(displayValue) * -1));
  };

  const handlePercent = () => {
    setDisplayValue(String(parseFloat(displayValue) / 100));
  };

  const handleDot = () => {
    if (waitingForNewValue) {
      setDisplayValue('0.');
      setWaitingForNewValue(false);
    } else if (!displayValue.includes('.')) {
      setDisplayValue(displayValue + '.');
    }
  };

  const calcButtons = [
    { label: 'C', onClick: handleClear, className: 'bg-[#a5a5a5] text-black hover:bg-[#d4d4d2]' },
    { label: '+/-', onClick: handleToggleSign, className: 'bg-[#a5a5a5] text-black hover:bg-[#d4d4d2]' },
    { label: '%', onClick: handlePercent, className: 'bg-[#a5a5a5] text-black hover:bg-[#d4d4d2]' },
    { label: '÷', onClick: () => handleOp('÷'), className: 'bg-[#ff9f0a] text-white hover:bg-[#ffb340]', active: operator === '÷' },
    
    { label: '7', onClick: () => handleNum('7'), className: 'bg-[#333333] text-white hover:bg-[#737373]' },
    { label: '8', onClick: () => handleNum('8'), className: 'bg-[#333333] text-white hover:bg-[#737373]' },
    { label: '9', onClick: () => handleNum('9'), className: 'bg-[#333333] text-white hover:bg-[#737373]' },
    { label: '×', onClick: () => handleOp('×'), className: 'bg-[#ff9f0a] text-white hover:bg-[#ffb340]', active: operator === '×' },
    
    { label: '4', onClick: () => handleNum('4'), className: 'bg-[#333333] text-white hover:bg-[#737373]' },
    { label: '5', onClick: () => handleNum('5'), className: 'bg-[#333333] text-white hover:bg-[#737373]' },
    { label: '6', onClick: () => handleNum('6'), className: 'bg-[#333333] text-white hover:bg-[#737373]' },
    { label: '-', onClick: () => handleOp('-'), className: 'bg-[#ff9f0a] text-white hover:bg-[#ffb340]', active: operator === '-' },
    
    { label: '1', onClick: () => handleNum('1'), className: 'bg-[#333333] text-white hover:bg-[#737373]' },
    { label: '2', onClick: () => handleNum('2'), className: 'bg-[#333333] text-white hover:bg-[#737373]' },
    { label: '3', onClick: () => handleNum('3'), className: 'bg-[#333333] text-white hover:bg-[#737373]' },
    { label: '+', onClick: () => handleOp('+'), className: 'bg-[#ff9f0a] text-white hover:bg-[#ffb340]', active: operator === '+' },
    
    { label: '0', onClick: () => handleNum('0'), className: 'bg-[#333333] text-white hover:bg-[#737373] col-span-2 aspect-auto rounded-full text-left pl-[30px]' },
    { label: '.', onClick: handleDot, className: 'bg-[#333333] text-white hover:bg-[#737373]' },
    { label: '=', onClick: handleEqual, className: 'bg-[#ff9f0a] text-white hover:bg-[#ffb340]' },
  ];

  return (
    <>
      <div className="shrink-0 space-y-2 px-3 pb-4">
        <div
          className={cn(
            'w-full rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm',
            isSidebarOpen
              ? 'flex h-12 items-center gap-1 px-2'
              : 'flex flex-col items-center gap-1 py-2'
          )}
        >
          <button
            type="button"
            onClick={zoomOut}
            disabled={!canZoomOut}
            title={t('zoomOut')}
            aria-label={t('zoomOut')}
            className={cn(
              'flex items-center justify-center rounded-[var(--radius-lg)] transition-all duration-200',
              'text-[var(--text-secondary)] hover:bg-[var(--color-brand)]/10 hover:text-[var(--color-brand)]',
              'disabled:pointer-events-none disabled:opacity-40',
              isSidebarOpen ? 'h-9 flex-1' : 'h-8 w-8'
            )}
          >
            <ZoomOut size={isSidebarOpen ? 18 : 16} />
          </button>
          <span
            className={cn(
              'shrink-0 font-semibold tabular-nums text-[var(--text-secondary)]',
              isSidebarOpen
                ? 'min-w-[2.5rem] text-center text-[var(--text-xs)]'
                : 'text-[10px] leading-none'
            )}
          >
            {zoomPercent}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={!canZoomIn}
            title={t('zoomIn')}
            aria-label={t('zoomIn')}
            className={cn(
              'flex items-center justify-center rounded-[var(--radius-lg)] transition-all duration-200',
              'text-[var(--text-secondary)] hover:bg-[var(--color-brand)]/10 hover:text-[var(--color-brand)]',
              'disabled:pointer-events-none disabled:opacity-40',
              isSidebarOpen ? 'h-9 flex-1' : 'h-8 w-8'
            )}
          >
            <ZoomIn size={isSidebarOpen ? 18 : 16} />
          </button>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className={cn(
            'group relative flex h-12 w-full rounded-[var(--radius-xl)] transition-all duration-300',
            isSidebarOpen ? 'items-center gap-4 px-3' : 'items-center justify-center px-0',
            open 
              ? 'bg-[var(--color-brand)]/20 border border-[var(--color-brand)]/50 text-[var(--color-brand)]'
              : 'bg-[var(--bg-surface)] hover:bg-[var(--color-brand)]/10 border border-[var(--border-subtle)] hover:border-[var(--color-brand)]/30 shadow-sm'
          )}
        >
          <span className={cn(
            "w-6 h-6 flex items-center justify-center transition-colors",
            open ? 'text-[var(--color-brand)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--color-brand)]'
          )}>
            <Calculator size={18} />
          </span>
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-semibold text-[var(--text-sm)] tracking-wide whitespace-nowrap overflow-hidden"
              >
                Calculator
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            className="fixed bottom-24 left-[88px] z-50 origin-bottom-left"
            style={{ left: isSidebarOpen ? '276px' : '88px' }}
          >
            <div className="bg-black rounded-[40px] shadow-2xl p-6 w-[320px] overflow-hidden border border-white/10 relative flex flex-col">
              
              {/* Drag Handle Header / Close */}
              <div 
                className="flex items-center justify-between mb-2 cursor-grab active:cursor-grabbing -mt-2 -mx-2 p-2 rounded-t-3xl"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="flex-1 flex justify-center">
                  <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:bg-white/20 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Display */}
              <div className="flex items-end justify-end w-full h-[100px] pb-2 mb-4">
                <div 
                  className="text-white font-light tabular-nums truncate w-full text-right"
                  style={{ fontSize: displayValue.length > 7 ? '2.5rem' : '4.5rem', lineHeight: 1 }}
                >
                  {displayValue}
                </div>
              </div>

              {/* Buttons Grid */}
              <div className="grid grid-cols-4 gap-3">
                {calcButtons.map((btn, idx) => (
                  <button
                    key={idx}
                    onClick={btn.onClick}
                    className={cn(
                      'flex items-center justify-center text-3xl font-medium rounded-full active:opacity-70 transition-all',
                      btn.label === '0' ? 'col-span-2 aspect-[2.1/1] !justify-start pl-[26px]' : 'aspect-square',
                      btn.className,
                      btn.active && 'bg-white text-[#ff9f0a]'
                    )}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
