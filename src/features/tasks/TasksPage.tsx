import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import type { Id } from '@/../convex/_generated/dataModel'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/hooks/useSettings'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { formatDate, cn } from '@/lib/utils'
import { NewTaskModal } from './NewTaskModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import { Plus, Calendar, Tag, User, Trash2, MoreHorizontal, Search, Clock, AlertCircle, CheckSquare, ListTodo, Archive } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { ArchiveModal } from './ArchiveModal'
import { TotalTasksModal } from './TotalTasksModal'
import { CompletedStageModal } from './CompletedStageModal'

export default function TasksPage() {
  const { token } = useAuth()
  const { t } = useSettings()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<any | null>(null)
  const [activeColumn, setActiveColumn] = useState('todo')
  const [deleteTaskId, setDeleteTaskId] = useState<Id<'tasks'> | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [archiveModalOpen, setArchiveModalOpen] = useState(false)
  const [archiveStageSlug, setArchiveStageSlug] = useState<string>('')
  const [archiveStageName, setArchiveStageName] = useState<string>('')
  const [isTotalTasksModalOpen, setIsTotalTasksModalOpen] = useState(false)
  const [isCompletedStageModalOpen, setIsCompletedStageModalOpen] = useState(false)
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Dynamic Stages
  const stages = useQuery(api.task_stages.getStages, token ? { token } : 'skip')
  const initializeStages = useMutation(api.task_stages.initializeDefaultStages)
  const addStage = useMutation(api.task_stages.addStage)
  const deleteStage = useMutation(api.task_stages.deleteStage)
  const updateStage = useMutation(api.task_stages.updateStage)

  useEffect(() => {
    if (token && stages && stages.length === 0) {
      initializeStages({ token }).catch(console.error)
    }
  }, [token, stages, initializeStages])

  const tasksData = useQuery(api.tasks.getTasks, token ? { token } : 'skip')
  const archivedTasksData = useQuery(api.tasks.getArchivedTasks, token && archiveStageSlug ? { token, stageSlug: archiveStageSlug } : 'skip')
  // Force refresh when stage changes
  const [, setRefreshKey] = useState(0)
  const tasks: any[] = tasksData ?? []
  const archivedTasks: any[] = archivedTasksData ?? []
  
  const updateTask = useMutation(api.tasks.updateTask)
  const deleteTask = useMutation(api.tasks.deleteTask)
  const archiveTask = useMutation(api.tasks.archiveTask)
  const unarchiveTask = useMutation(api.tasks.unarchiveTask)

  const [renamingStage, setRenamingStage] = useState<{ id: Id<"task_stages">; name: string } | null>(null)
  const [isAddingStage, setIsAddingStage] = useState(false)
  const [newStageName, setNewStageName] = useState('')

  const completedStage = useMemo(() => (stages || []).find(s => s.isCompletedStage) || (stages || []).find(s => s.slug === 'done'), [stages])

  // Stats
  const stats = useMemo(() => ({
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'doing' || t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === (completedStage?.slug || 'done')).length,
    overdue: tasks.filter(t => {
      if (!t.dueDate || t.status === 'done') return false
      return new Date(t.dueDate) < new Date()
    }).length,
  }), [tasks])

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !token) return
    const { draggableId, destination } = result
    const taskId = draggableId as Id<'tasks'>
    updateTask({
      token,
      taskId,
      status: destination.droppableId,
      order: destination.index
    }).catch(console.error)
  }

  const handleAddCard = (status?: string) => {
    setEditingTask(null)
    setActiveColumn(status || stages?.[0]?.slug || 'todo')
    setIsModalOpen(true)
  }

  const performAddStage = async () => {
    if (!token || !newStageName.trim()) return
    try {
      await addStage({ token, name: newStageName.trim() })
      setNewStageName('')
      setIsAddingStage(false)
      toast(t("listAdded"), "success")
    } catch (err) {
      toast(t("listAddFailed"), "error")
    }
  }

  const handleDeleteStage = async (stageId: Id<"task_stages">) => {
    if (!token) return
    if (!confirm(t("deleteListConfirm"))) return
    try {
      await deleteStage({ token, stageId })
      toast(t("listDeleted"), "success")
    } catch (err) {
      toast(t("listDeleteFailed"), "error")
    }
  }

  const handleRenameStage = async () => {
    if (!token || !renamingStage) return
    try {
      await updateStage({ token, stageId: renamingStage.id, name: renamingStage.name })
      setRenamingStage(null)
      toast(t("listRenamed"), "success")
    } catch (err) {
      toast(t("listRenameFailed"), "error")
    }
  }

  const handleOpenArchive = (stageSlug: string, stageName: string) => {
    setArchiveStageSlug(stageSlug)
    setArchiveStageName(stageName)
    setArchiveModalOpen(true)
  }

  const handleRestoreTask = useCallback(async (taskId: any, stageSlug?: string) => {
    if (!token) return
    try {
      await unarchiveTask({ token, taskId })
      toast(t("taskRestored"), "success")
      // Force refresh by incrementing the key
      setRefreshKey(k => k + 1)
      // Close archive modal after short delay
      setTimeout(() => {
        setArchiveModalOpen(false)
      }, 500)
    } catch (err) {
      toast(t("taskRestoreFailed"), "error")
    }
  }, [token, unarchiveTask, toast, t])

  const handleDeleteArchivedTask = async (taskId: any) => {
    if (!token) return
    try {
      await deleteTask({ token, taskId })
      toast(t("taskDeleted"), "success")
    } catch (err) {
      toast(t("taskDeleteFailed"), "error")
    }
  }

  const confirmDelete = async () => {
    if (!token || !deleteTaskId) return
    try {
      await deleteTask({ token, taskId: deleteTaskId })
      toast(t("taskDeleted"), "success")
    } catch (err) {
      toast(t("taskDeleteFailed"), "error")
    } finally {
      setDeleteTaskId(null)
    }
  }

  return (
    <PageWrapper
      title={t("taskBoard")}
      subtitle={t('organizeTasks')}
      actions={
        <Button size="sm" onClick={() => handleAddCard()}>
          <Plus size={16} className="ml-1" /> {t('newTask')}
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => setIsTotalTasksModalOpen(true)}
        >
          <div className="flex items-center gap-2 mb-1">
            <ListTodo size={14} className="text-[var(--text-muted)]" />
            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{t("totalCount")}</span>
          </div>
          <h3 className="text-2xl font-black text-[var(--text-primary)]">{stats.total}</h3>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-amber-400" />
            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{t("todo")}</span>
          </div>
          <h3 className="text-2xl font-black text-[var(--text-primary)]">{stats.todo}</h3>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={14} className="text-blue-400" />
            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{t("inProgress")}</span>
          </div>
          <h3 className="text-2xl font-black text-[var(--text-primary)]">{stats.inProgress}</h3>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => setIsCompletedStageModalOpen(true)}
        >
          <div className="flex items-center gap-2 mb-1">
            <CheckSquare size={14} className="text-emerald-400" />
            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
              {completedStage?.name || t("done")}
            </span>
          </div>
          <h3 className="text-2xl font-black text-emerald-400">{stats.done}</h3>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={14} className="text-rose-400" />
            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{t("overdue")}</span>
          </div>
          <h3 className="text-2xl font-black text-rose-400">{stats.overdue}</h3>
        </motion.div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <Input
            placeholder={t("searchTasksPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={18} className="text-[var(--text-muted)]" />}
          />
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-8 items-start scrollbar-hide">
          {(stages || []).map((column, columnIndex) => {
            const isCompletedStage = column._id === completedStage?._id;
            const columnTasks = tasks?.filter(t => {
              const matchesSearch = !debouncedSearch || t.title?.toLowerCase().includes(debouncedSearch.toLowerCase())
              return t.status === column.slug && matchesSearch
            }) || []
            
            return (
              <motion.div 
                key={column._id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: columnIndex * 0.1 }}
                className="flex-shrink-0 w-80 flex flex-col gap-4 max-h-[calc(100vh-280px)]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    {renamingStage?.id === column._id ? (
                      <input 
                        autoFocus
                        value={renamingStage.name}
                        onChange={e => setRenamingStage({...renamingStage, name: e.target.value})}
                        onBlur={handleRenameStage}
                        onKeyDown={e => e.key === 'Enter' && handleRenameStage()}
                        className="text-xs font-bold bg-white/10 border-none outline-none px-2 py-1 rounded w-32"
                      />
                    ) : (
                      <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">
                        {column.name}
                      </h3>
                    )}
                    <Badge variant="muted" className="rounded-full bg-white/5 border-none text-[10px]">{columnTasks.length}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleOpenArchive(column.slug || '', column.name || '')}
                      className="group p-1.5 text-[var(--text-muted)] hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all"
                      title="أرشيف"
                    >
                      <Archive size={14} className="transition-all duration-300 group-hover:scale-125 group-hover:rotate-[-20deg]" />
                    </button>
                    <button 
                      onClick={() => setRenamingStage({ id: column._id, name: column.name })}
                      className="p-1.5 text-[var(--text-muted)] hover:text-brand hover:bg-brand/10 rounded-lg transition-all"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteStage(column._id)}
                      className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={column.slug ?? 'todo'}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={cn(
                        "flex-1 flex flex-col gap-3 p-3 rounded-2xl border-2 border-dashed min-h-[250px] transition-colors overflow-y-auto scrollbar-thin",
                        snapshot.isDraggingOver ? "bg-brand/10 border-brand/40" : "bg-white/[0.02] border-transparent"
                      )}
                    >
                      <motion.div layout className="flex flex-col gap-3">
                        {columnTasks.map((task, index) => {
                          const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'
                          return (
                            <Draggable key={task._id} draggableId={task._id.toString()} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={provided.draggableProps.style}
                                  className={cn("group outline-none mb-3 last:mb-0", snapshot.isDragging && "z-[9999]")}
                                >
                                  <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                  >
                                    <Card 
                                      glass 
                                      className={cn(
                                        "p-4 transition-all duration-300 cursor-grab active:cursor-grabbing",
                                        "hover:bg-white/[0.04] hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1",
                                        isCompletedStage ? "bg-emerald-500/10 border-emerald-500/30" : "bg-white/[0.02] border-white/5",
                                        snapshot.isDragging ? "shadow-2xl ring-2 ring-brand/50 border-brand bg-brand/5" : ""
                                      )}
                                    >
                                      {/* Header */}
                                      <div className="flex justify-end items-start mb-2">
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                          <button 
                                            onClick={() => token && archiveTask({ token, taskId: task._id as Id<'tasks'> }).catch(console.error)}
                                            className="p-1.5 text-amber-500 hover:bg-amber-500/20 rounded-lg transition-all"
                                            title="أرشيف"
                                          >
                                            <Archive size={14} className="transition-transform hover:scale-125 hover:rotate-12" />
                                          </button>
                                          <button 
                                            onClick={() => setDeleteTaskId(task._id)}
                                            className="p-1.5 text-rose-500 hover:bg-rose-500/20 rounded-lg transition-all"
                                          >
                                            <Trash2 size={14} className="transition-transform hover:scale-110" />
                                          </button>
                                        </div>
                                      </div>
                                      
                                      {/* Title */}
                                      <h4 
                                        className={cn("font-bold text-sm mb-2 transition-colors line-clamp-2 cursor-pointer", isCompletedStage ? "text-emerald-400 line-through opacity-80" : "text-[var(--text-primary)] group-hover:text-brand")}
                                        onClick={() => setEditingTask(task)}
                                      >
                                        {isCompletedStage && <CheckSquare size={14} className="inline mr-1 mb-0.5" />}
                                        {task.title}
                                      </h4>
                                      
                                      {/* Description */}
                                      {task.description && (
                                        <p className="text-[var(--text-muted)] text-[11px] mb-3 line-clamp-2 leading-relaxed">
                                          {task.description}
                                        </p>
                                      )}
                                      
                                      {/* Meta */}
                                      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] border-t border-white/5 pt-3 mt-1">
                                        <div className="flex items-center gap-3">
                                          {task.dueDate && (
                                            <span className={cn(
                                              "flex items-center gap-1",
                                              isOverdue ? "text-rose-400" : "text-orange-400/80"
                                            )}>
                                              <Calendar size={12} /> {formatDate(task.dueDate)}
                                            </span>
                                          )}
                                          <span className="flex items-center gap-1">
                                            <Tag size={12} /> {t('taskLabel')}
                                          </span>
                                        </div>
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-brand to-indigo-500 flex items-center justify-center text-white shadow-lg border border-white/10">
                                          <User size={10} />
                                        </div>
                                      </div>
                                    </Card>
                                  </motion.div>
                                </div>
                              )}
                            </Draggable>
                          )
                        })}
                      </motion.div>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
                
                {/* Add Card Button */}
                <motion.button 
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(99, 102, 241, 0.08)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAddCard(column.slug)}
                  className="w-full py-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-[var(--text-muted)] hover:text-brand hover:border-brand/50 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Plus size={14} className="ml-1" /> {t('addTask')}
                </motion.button>
              </motion.div>
            )
          })}

          {/* Add Another List */}
          <div className="flex-shrink-0 w-80">
            {isAddingStage ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full p-4 rounded-2xl bg-white/5 border border-brand border-dashed flex flex-col gap-3"
              >
                <input 
                  autoFocus
                  placeholder={t("listNamePlaceholder")}
                  value={newStageName}
                  onChange={e => setNewStageName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && performAddStage()}
                  className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand"
                />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={performAddStage}>{t("addButton")}</Button>
                  <Button size="sm" variant="secondary" onClick={() => setIsAddingStage(false)}>{t("cancel")}</Button>
                </div>
              </motion.div>
            ) : (
              <button 
                onClick={() => setIsAddingStage(true)}
                className="w-full p-4 rounded-2xl bg-white/5 border border-dashed border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-brand hover:border-brand hover:bg-brand/5 transition-all text-sm font-bold flex items-center gap-2"
              >
                <Plus size={20} /> {t('addAnotherList')}
              </button>
            )}
          </div>
        </div>
      </DragDropContext>

      <NewTaskModal 
        isOpen={isModalOpen || !!editingTask} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }} 
        status={activeColumn}
        taskToEdit={editingTask}
      />
      
      <ConfirmDialog
        isOpen={!!deleteTaskId}
        onClose={() => setDeleteTaskId(null)}
        onConfirm={confirmDelete}
        title={t("deleteTaskTitle")}
        description={t("deleteTaskDesc")}
        confirmText={t("confirmDelete")}
        variant="danger"
      />

      <ArchiveModal
        isOpen={archiveModalOpen}
        onClose={() => setArchiveModalOpen(false)}
        stageName={archiveStageName ?? ''}
        stageSlug={archiveStageSlug ?? ''}
        tasks={archivedTasks}
        onRestoreTask={handleRestoreTask}
        onDeleteTask={handleDeleteArchivedTask}
      />

      <TotalTasksModal
        isOpen={isTotalTasksModalOpen}
        onClose={() => setIsTotalTasksModalOpen(false)}
        tasks={tasks}
        stages={stages || []}
      />

      <CompletedStageModal
        isOpen={isCompletedStageModalOpen}
        onClose={() => setIsCompletedStageModalOpen(false)}
        stages={stages || []}
        completedStageId={completedStage?._id}
      />
    </PageWrapper>
  )
}
