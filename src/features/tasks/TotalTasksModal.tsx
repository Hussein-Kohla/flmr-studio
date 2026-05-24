import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { X, Calendar, Tag, User } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

interface TotalTasksModalProps {
  isOpen: boolean
  onClose: () => void
  tasks: any[]
  stages: any[]
}

export function TotalTasksModal({ isOpen, onClose, tasks, stages }: TotalTasksModalProps) {
  const { t } = useSettings()

  // Group tasks by status
  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: any[] } = {}
    
    // Initialize groups based on stages to maintain order
    stages.forEach(stage => {
      groups[stage.slug] = []
    })
    
    // Add tasks to their respective groups
    tasks.forEach(task => {
      if (!groups[task.status]) {
        groups[task.status] = []
      }
      groups[task.status].push(task)
    })
    
    return groups
  }, [tasks, stages])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl max-h-[85vh] bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">{t("totalTasks") || "إجمالي المهام"}</h3>
            <p className="text-xs text-[var(--text-muted)]">{tasks.length} {t("tasks") || "مهام"}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
          {stages.map(stage => {
            const stageTasks = groupedTasks[stage.slug] || []
            if (stageTasks.length === 0) return null

            return (
              <div key={stage._id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">{stage.name}</h4>
                  <Badge variant="muted" className="bg-white/5 border-none text-[10px]">
                    {stageTasks.length}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {stageTasks.map(task => (
                    <Card key={task._id} glass className="p-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors border-white/5">
                      <h5 className="font-bold text-sm mb-1 line-clamp-1">{task.title}</h5>
                      {task.description && (
                        <p className="text-xs text-[var(--text-muted)] mb-2 line-clamp-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                        {task.dueDate && (
                          <span className="flex items-center gap-1 text-orange-400/80">
                            <Calendar size={12} /> {formatDate(task.dueDate)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Tag size={12} /> {stage.name}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
          
          {tasks.length === 0 && (
            <div className="text-center py-12 text-[var(--text-muted)] text-sm">
              {t("noTasksFound") || "لا توجد مهام"}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
