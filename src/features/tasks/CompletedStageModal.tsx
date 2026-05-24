import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, CheckSquare } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useMutation } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import type { Id } from '@/../convex/_generated/dataModel'
import { useToast } from '@/components/ui/Toast'

interface CompletedStageModalProps {
  isOpen: boolean
  onClose: () => void
  stages: any[]
  completedStageId?: string
}

export function CompletedStageModal({ isOpen, onClose, stages, completedStageId }: CompletedStageModalProps) {
  const { t } = useSettings()
  const { token } = useAuth()
  const { toast } = useToast()
  const setCompletedStage = useMutation(api.task_stages.setCompletedStage)
  
  const [selectedStage, setSelectedStage] = useState<string | undefined>(completedStageId)

  // Update local state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedStage(completedStageId)
    }
  }, [isOpen, completedStageId])

  if (!isOpen) return null

  const handleSave = async () => {
    if (!token || !selectedStage) return
    
    try {
      await setCompletedStage({ token, stageId: selectedStage as Id<"task_stages"> })
      toast("تم تعيين قائمة المكتمل بنجاح", "success")
      onClose()
    } catch (err) {
      toast("حدث خطأ أثناء حفظ الإعدادات", "error")
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare size={18} className="text-emerald-500" />
            <h3 className="text-lg font-bold">تعيين قائمة المكتمل</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-xs text-[var(--text-muted)]">
            اختر القائمة التي تعتبر مهامها مكتملة. أي مهمة تُسحب إلى هذه القائمة ستتحول للون الأخضر.
          </p>
          
          <div className="flex flex-col gap-2">
            {stages.map(stage => (
              <label 
                key={stage._id}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedStage === stage._id 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" 
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="completedStage" 
                    value={stage._id}
                    checked={selectedStage === stage._id}
                    onChange={() => setSelectedStage(stage._id)}
                    className="accent-emerald-500 w-4 h-4"
                  />
                  <span className="font-bold text-sm">{stage.name}</span>
                </div>
                {selectedStage === stage._id && (
                  <CheckSquare size={16} />
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-subtle)] flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {t("cancel") || "إلغاء"}
          </Button>
          <Button 
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white" 
            onClick={handleSave}
            disabled={!selectedStage}
          >
            {t("save") || "حفظ"}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
