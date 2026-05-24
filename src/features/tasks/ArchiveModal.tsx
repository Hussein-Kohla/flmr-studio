import { useMemo } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { X, Calendar, Tag, User, Archive as ArchiveIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatDate, cn } from '@/lib/utils'

interface ArchivedTask {
  _id: any
  title: string
  description?: string
  status: string
  dueDate?: number
  createdAt: number
  completedAt?: number
}

interface ArchiveModalProps {
  isOpen: boolean
  onClose: () => void
  stageName: string
  stageSlug: string
  tasks: ArchivedTask[]
  onRestoreTask: (taskId: any) => void
  onDeleteTask: (taskId: any) => void
}

export function ArchiveModal({ 
  isOpen, 
  onClose, 
  stageName, 
  tasks,
  onRestoreTask,
  onDeleteTask 
}: ArchiveModalProps) {
  const { t } = useSettings()

  // Group tasks by date
  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: ArchivedTask[] } = {}
    tasks.forEach(task => {
      const date = new Date(task.completedAt || task.createdAt).toDateString()
      if (!groups[date]) groups[date] = []
      groups[date].push(task)
    })
    // Sort groups by date (newest first)
    return Object.entries(groups)
      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
  }, [tasks])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl max-h-[85vh] bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <ArchiveIcon size={20} className="text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{t('archive')}</h3>
              <p className="text-xs text-[var(--text-muted)]">{stageName} - {tasks.length} {t('tasks')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <ArchiveIcon size={24} className="text-[var(--text-muted)]" />
              </div>
              <p className="text-sm text-[var(--text-muted)]">{t('noArchivedTasks')}</p>
            </div>
          ) : (
            groupedTasks.map(([date, dateTasks]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                  <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest px-3 py-1 rounded-full bg-white/5">
                    {formatDate(date)}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                </div>

                {/* Tasks for this date */}
                <div className="space-y-3">
                  {dateTasks.map((task) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={task._id}
                    >
                      <Card 
                        glass 
                        className="p-4 hover:bg-white/[0.04] transition-all group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-[var(--text-primary)] text-sm line-clamp-2 group-hover:text-brand transition-colors">
                            {task.title}
                          </h4>
                        </div>
                        
                        {task.description && (
                          <p className="text-[var(--text-muted)] text-[11px] mb-3 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] border-t border-white/5 pt-3">
                          <div className="flex items-center gap-3">
                            {task.dueDate && (
                              <span className="flex items-center gap-1 text-orange-400/80">
                                <Calendar size={12} /> {formatDate(task.dueDate)}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Tag size={12} /> {stageName}
                            </span>
                          </div>
                          <span className="text-[10px]">
                            {task.completedAt ? `${t('completed')}: ` : ''}{formatDate(task.completedAt || task.createdAt)}
                          </span>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            variant="secondary"
                            className="flex-1 text-xs"
                            onClick={() => onRestoreTask(task._id)}
                          >
                            {t('restore')}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="danger"
                            className="flex-1 text-xs"
                            onClick={() => onDeleteTask(task._id)}
                          >
                            {t('delete')}
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-subtle)]">
          <Button variant="secondary" className="w-full" onClick={onClose}>
            {t('close')}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}