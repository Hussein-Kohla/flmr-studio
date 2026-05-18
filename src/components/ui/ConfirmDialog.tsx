import { Modal } from './Modal'
import { Button } from './Button'
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'success' | 'info'
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  
  const themes = {
    danger: {
      icon: <XCircle className="text-red-500" size={48} />,
      btn: "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20",
      bg: "bg-red-500/5",
      border: "border-red-500/20"
    },
    success: {
      icon: <CheckCircle2 className="text-emerald-500" size={48} />,
      btn: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20",
      bg: "bg-emerald-500/5",
      border: "border-emerald-500/20"
    },
    info: {
      icon: <AlertCircle className="text-blue-500" size={48} />,
      btn: "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20",
      bg: "bg-blue-500/5",
      border: "border-blue-500/20"
    }
  }

  const theme = themes[variant]

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" className="!p-0 border-none bg-transparent">
      <div className={cn("relative p-8 rounded-[32px] border bg-[var(--bg-card)] overflow-hidden", theme.border)}>
        {/* Glow Background */}
        <div className={cn("absolute -top-24 -right-24 w-48 h-48 blur-[100px] opacity-20", variant === 'danger' ? 'bg-red-500' : 'bg-emerald-500')} />
        
        <div className="relative z-10 flex flex-col items-center text-center gap-6">
          <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-2", theme.bg)}>
             {theme.icon}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-[var(--text-primary)]">{title}</h3>
            <p className="text-[var(--text-muted)] text-sm font-medium leading-relaxed max-w-[240px]">
              {description}
            </p>
          </div>

          <div className="flex gap-3 w-full mt-2">
            <Button 
              variant="secondary" 
              className="flex-1 h-14 rounded-2xl font-bold bg-white/5 border-white/5 hover:bg-white/10 text-[var(--text-primary)]"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button 
              className={cn("flex-1 h-14 rounded-2xl font-bold transition-all active:scale-95", theme.btn)}
              onClick={onConfirm}
              loading={isLoading}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
