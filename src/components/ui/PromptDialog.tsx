import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { PencilLine } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PromptDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (value: string) => void
  title: string
  description: string
  defaultValue?: string
  placeholder?: string
  type?: 'text' | 'number'
  confirmText?: string
  cancelText?: string
}

export function PromptDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  defaultValue = '',
  placeholder = '',
  type = 'text',
  confirmText = 'Save',
  cancelText = 'Cancel',
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue)
    }
  }, [isOpen, defaultValue])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    onConfirm(value)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" className="!p-0 border-none bg-transparent">
      <div className="relative p-8 rounded-[32px] border border-indigo-500/20 bg-[var(--bg-card)] overflow-hidden">
        {/* Glow Background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 blur-[100px] opacity-20 bg-indigo-500" />
        
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
               <PencilLine size={28} />
            </div>
            <div className="flex-1">
                <h3 className="text-xl font-black text-[var(--text-primary)] leading-tight">{title}</h3>
                <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest mt-1">
                {description}
                </p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input 
                autoFocus
                type={type}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className={cn(
                  "w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-lg font-bold text-white outline-none focus:border-indigo-500 transition-all",
                  "placeholder:text-white/10"
                )}
              />
            </div>

            <div className="flex gap-3 w-full">
              <Button 
                type="button"
                variant="secondary" 
                className="flex-1 h-14 rounded-2xl font-bold bg-white/5 border-white/5 hover:bg-white/10 text-[var(--text-primary)]"
                onClick={onClose}
              >
                {cancelText}
              </Button>
              <Button 
                type="submit"
                className="flex-1 h-14 rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
              >
                {confirmText}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  )
}
