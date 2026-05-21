import { useState, useEffect, useMemo } from 'react'
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
import { Plus, Calendar, Tag, User, CheckCircle2, Trash2, MoreHorizontal, Search, Clock, AlertCircle, CheckSquare, ListTodo } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'

const PRIORITY_COLORS = {
  low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  urgent: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
}

export default function TasksPage() {
  const { token } = useAuth()
  const { t } = useSettings()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeColumn, setActiveColumn] = useState('todo')
  const [deleteTaskId, setDeleteTaskId] = useState<Id<'tasks'> | null>(null)
  const [completeTaskId, setCompleteTaskId] = useState<Id<'tasks'> | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('all')
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

  const tasksData = useQuery(api.tasks.getTasks, token ? { token, paginationOpts: { numItems: 100, cursor: null } } : 'skip')
  const tasks = tasksData?.page || []
  
  const updateTask = useMutation(api.tasks.updateTask)
  const deleteTask = useMutation(api.tasks.deleteTask)

  const [renamingStage, setRenamingStage] = useState<{ id: Id<"task_stages">; name: string } | null>(null)
  const [isAddingStage, setIsAddingStage] = useState(false)
  const [newStageName, setNewStageName] = useState('')

  // Stats
  const stats = useMemo(() => ({
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
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

  const handleAddCard = (status: string) => {
    setActiveColumn(status)
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

  const confirmComplete = async () => {
    if (!token || !completeTaskId) return
    try {
      await updateTask({ token, taskId: completeTaskId, status: 'done' })
      toast(t("taskCompleted"), "success")
    } catch (err) {
      toast(t("taskUpdateFailed"), "error")
    } finally {
      setCompleteTaskId(null)
    }
  }

  return (
    <PageWrapper
      title={t("taskBoard")}
      subtitle="{t('organizeTasks')}"
      actions={
        <Button size="sm" onClick={() => handleAddCard('todo')}>
          <Plus size={16} className="mr-2" /> New Task
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-4"
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
          className="bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <CheckSquare size={14} className="text-emerald-400" />
            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{t("done")}</span>
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

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <Input
            placeholder={t("searchTasksPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={18} className="text-[var(--text-muted)]" />}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="h-10 px-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-secondary)] focus:outline-none"
          >
            <option value="all">{t('allPriorities')}</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">{t("urgent")}</option>
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-8 items-start scrollbar-hide">
          {(stages || []).map((column, columnIndex) => {
            const columnTasks = tasks?.filter(t => {
              const matchesSearch = !debouncedSearch || t.title?.toLowerCase().includes(debouncedSearch.toLowerCase())
              const matchesPriority = filterPriority === 'all' || t.priority === filterPriority
              return t.status === column.slug && matchesSearch && matchesPriority
            }) || []
            
            return (
              <motion.div 
                key={column._id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: columnIndex * 0.1 }}
                className="flex-shrink-0 w-80 flex flex-col gap-4"
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
                <Droppable droppableId={column.slug}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={cn(
                        "flex-1 flex flex-col gap-3 p-3 rounded-2xl border-2 border-dashed min-h-[250px] transition-colors",
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
                                        "bg-white/[0.02] border-white/5",
                                        snapshot.isDragging ? "shadow-2xl ring-2 ring-brand/50 border-brand bg-brand/5" : ""
                                      )}
                                    >
                                      {/* Header */}
                                      <div className="flex justify-between items-start mb-2">
                                        <Badge className={cn("text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md border", PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.low)}>
                                          {task.priority}
                                        </Badge>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                          {task.status !== 'done' && (
                                            <button 
                                              onClick={() => setCompleteTaskId(task._id)}
                                              className="p-1.5 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-all"
                                            >
                                              <CheckCircle2 size={14} />
                                            </button>
                                          )}
                                          <button 
                                            onClick={() => setDeleteTaskId(task._id)}
                                            className="p-1.5 text-rose-500 hover:bg-rose-500/20 rounded-lg transition-all"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      </div>
                                      
                                      {/* Title */}
                                      <h4 className="font-bold text-[var(--text-primary)] text-sm mb-2 group-hover:text-brand transition-colors line-clamp-2">
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
                                            <Tag size={12} /> Task
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
                  <Plus size={14} className="mr-1" /> Add Task
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
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        status={activeColumn} 
      />
      
      <ConfirmDialog
        isOpen={!!deleteTaskId}
        onClose={() => setDeleteTaskId(null)}
        onConfirm={confirmDelete}
        title="Delete Task?"
        description="Are you sure you want to remove this task?"
        confirmText="Yes, Delete"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!completeTaskId}
        onClose={() => setCompleteTaskId(null)}
        onConfirm={confirmComplete}
        title="Complete Task?"
        description="Mark this task as finished?"
        confirmText="Yes, Complete"
        variant="success"
      />
    </PageWrapper>
  )
}
