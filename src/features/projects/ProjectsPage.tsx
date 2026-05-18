import { useQuery, useMutation } from 'convex/react'
import { motion } from 'framer-motion'
import { api } from '@/../convex/_generated/api'
import { useAuth } from '@/hooks/useAuth'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatCurrency, cn, calculateProjectProgress } from '@/lib/utils'
import React, { useState, useMemo, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { NewProjectModal } from './NewProjectModal'
import { ProjectDetailsModal } from './ProjectDetailsModal'
import { Layers, CheckCircle2, Clock, AlertCircle, LayoutGrid, List as ListIcon, Plus, Trash2, Search, Filter, ChevronLeft, ChevronRight, Briefcase, Calendar, DollarSign, Users } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { useDebounce } from '@/hooks/useDebounce'

const ITEMS_PER_PAGE = 20;

const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType; bgColor: string }> = {
  draft:     { label: 'Draft',      color: 'text-slate-400',   icon: Clock,       bgColor: 'bg-slate-500/10' },
  in_review: { label: 'In Review',  color: 'text-blue-400',   icon: AlertCircle, bgColor: 'bg-blue-500/10' },
  revision:  { label: 'Revision',   color: 'text-amber-400', icon: AlertCircle, bgColor: 'bg-amber-500/10' },
  approved:  { label: 'Approved',   color: 'text-purple-400', icon: CheckCircle2, bgColor: 'bg-purple-500/10' },
  done:      { label: 'Completed',  color: 'text-emerald-400', icon: CheckCircle2, bgColor: 'bg-emerald-500/10' },
}

export default function ProjectsPage() {
  const { token } = useAuth()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  
  // Pagination State
  const [paginationCursor, setPaginationCursor] = useState<string | null>(null);
  
  const projectsData = useQuery(api.projects.getProjects, token ? { 
    token, 
    paginationOpts: { numItems: ITEMS_PER_PAGE, cursor: paginationCursor } 
  } : 'skip')
  
  const clients = useQuery(api.clients.getClients, token ? { 
    token, 
    paginationOpts: { numItems: 100, cursor: null } 
  } : 'skip')?.page || []

  const updateProjectStatus = useMutation(api.projects.updateProjectStatus)
  const deleteProject = useMutation(api.projects.deleteProject)
  const updateProject = useMutation(api.projects.updateProject)
  
  const stages = useQuery(api.stages.getStages, token ? { token } : 'skip')
  const initializeStages = useMutation(api.stages.initializeDefaultStages)
  const addStage = useMutation(api.stages.addStage)
  
  useEffect(() => {
    if (token && stages && stages.length === 0) {
      initializeStages({ token }).catch(console.error)
    }
  }, [token, stages, initializeStages])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<any | null>(null)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const projects = projectsData?.page || []

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = !debouncedSearch || 
        p.title?.toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchesFilter = filterStatus === 'all' || p.status === filterStatus
      return matchesSearch && matchesFilter
    })
  }, [projects, debouncedSearch, filterStatus])

  // Project Stats
  const stats = useMemo(() => {
    return {
      total: projects.length,
      active: projects.filter(p => p.status !== 'done').length,
      completed: projects.filter(p => p.status === 'done').length,
      totalBudget: projects.reduce((a, p) => a + (p.budgetCents || 0), 0),
      totalRevenue: projects.reduce((a, p) => a + (p.paidCents || 0), 0),
    }
  }, [projects])

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !token) return
    const { draggableId, destination } = result
    
    const project = projects.find(p => p._id.toString() === draggableId)
    if (project && project.status !== destination.droppableId) {
      updateProjectStatus({ 
        token, 
        projectId: project._id, 
        status: destination.droppableId 
      }).catch(console.error)
    }
  }

  const handleDeleteProject = async (projectId: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteConfirmId(projectId)
  }

  const performDelete = async () => {
    if (!token || !deleteConfirmId) return
    try {
      await deleteProject({ token, projectId: deleteConfirmId as any })
      toast("Project deleted successfully.", "success")
    } catch (err) {
      console.error(err)
      toast("Failed to delete project.", "error")
    } finally {
      setDeleteConfirmId(null)
    }
  }

  return (
    <PageWrapper
      title="Projects & Pipelines"
      subtitle="Track your production workflow and creative deliverables"
      actions={
        <div className="flex gap-3">
          <div className="flex bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-subtle)]">
            <button 
              onClick={() => setViewMode('kanban')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'kanban' ? 'bg-brand text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'list' ? 'bg-brand text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              <ListIcon size={18} />
            </button>
          </div>
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} className="mr-2" /> New Project
          </Button>
        </div>
      }
    >
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Briefcase size={16} className="text-brand" />
            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Total</span>
          </div>
          <h3 className="text-2xl font-black text-[var(--text-primary)]">{stats.total}</h3>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Layers size={16} className="text-blue-400" />
            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Active</span>
          </div>
          <h3 className="text-2xl font-black text-[var(--text-primary)]">{stats.active}</h3>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Done</span>
          </div>
          <h3 className="text-2xl font-black text-[var(--text-primary)]">{stats.completed}</h3>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-emerald-400" />
            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Revenue</span>
          </div>
          <h3 className="text-2xl font-black text-emerald-400">{formatCurrency(stats.totalRevenue)}</h3>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-purple-400" />
            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Clients</span>
          </div>
          <h3 className="text-2xl font-black text-[var(--text-primary)]">{clients.length}</h3>
        </motion.div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={18} className="text-[var(--text-muted)]" />}
          />
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 px-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-secondary)] focus:outline-none focus:border-brand"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="in_review">In Review</option>
            <option value="revision">Revision</option>
            <option value="approved">Approved</option>
            <option value="done">Completed</option>
          </select>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 overflow-x-auto pb-8 items-start scrollbar-hide">
            {[...(stages || [])].sort((a, b) => a.order - b.order).map((stage, stageIndex) => {
              const meta = STATUS_META[stage.slug] || { label: stage.name, color: 'text-slate-400', icon: Clock, bgColor: 'bg-slate-500/10' }
              const Icon = meta.icon
              const columnProjects = filteredProjects.filter(p => p.status === stage.slug)
              
              return (
                <motion.div 
                  key={stage._id} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: stageIndex * 0.1 }}
                  className="flex-shrink-0 w-80 flex flex-col gap-4"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("p-1.5 rounded-lg", meta.bgColor)}>
                        <Icon size={14} className={meta.color} />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">{stage.name}</h3>
                    </div>
                    <span className="text-[10px] font-bold bg-white/5 px-2 py-1 rounded-full text-[var(--text-muted)]">
                      {columnProjects.length}
                    </span>
                  </div>

                  {/* Droppable Area */}
                  <Droppable droppableId={stage.slug}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={cn(
                          "flex-1 flex flex-col gap-3 p-3 rounded-2xl border-2 border-dashed min-h-[300px] transition-all",
                          snapshot.isDraggingOver ? "bg-brand/10 border-brand/40" : "bg-white/[0.02] border-transparent"
                        )}
                      >
                        <motion.div layout className="flex flex-col gap-3">
                          {columnProjects.map((project, index) => {
                            const client = clients.find(c => c._id === project.clientId)
                            const progress = calculateProjectProgress(project)
                            return (
                              <Draggable key={project._id} draggableId={project._id.toString()} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={cn("outline-none mb-3 last:mb-0", snapshot.isDragging && "z-[999]")}
                                  >
                                    <motion.div
                                      layout
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                    >
                                      <Card 
                                        glass 
                                        className={cn(
                                          "p-4 transition-all duration-300 cursor-grab active:cursor-grabbing group",
                                          "hover:bg-white/[0.04] hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1",
                                          "bg-white/[0.02] border-white/5",
                                          snapshot.isDragging ? "shadow-2xl ring-2 ring-brand/50 border-brand bg-brand/5" : ""
                                        )}
                                        onClick={() => setSelectedProject(project)}
                                      >
                                        {/* Project Title */}
                                        <h4 className="font-bold text-sm text-[var(--text-primary)] mb-3 group-hover:text-brand transition-colors line-clamp-2">
                                          {project.title}
                                        </h4>
                                        
                                        {/* Client */}
                                        {client && (
                                          <div className="flex items-center gap-2 mb-3">
                                            <Avatar name={client.name} src={client.avatarUrl} size="sm" />
                                            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tighter truncate">
                                              {client.name}
                                            </span>
                                          </div>
                                        )}
                                        
                                        {/* Progress */}
                                        <div className="space-y-1.5 mb-3">
                                          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-white/30">
                                            <span>Progress</span>
                                            <span className="group-hover:text-brand transition-colors">{progress}%</span>
                                          </div>
                                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div 
                                              initial={{ width: 0 }}
                                              animate={{ width: `${progress}%` }}
                                              className="h-full bg-gradient-to-r from-brand to-indigo-500 transition-all"
                                            />
                                          </div>
                                        </div>
                                        
                                        {/* Meta */}
                                        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] pt-2 border-t border-white/5">
                                          <div className="flex items-center gap-2">
                                            <Calendar size={10} />
                                            <span>{project.deadline ? formatDate(project.deadline) : 'No deadline'}</span>
                                          </div>
                                          <span className="font-bold text-emerald-400">
                                            {formatCurrency(project.paidCents || 0)}
                                          </span>
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
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setIsModalOpen(true); setFilterStatus(stage.slug); }}
                    className="w-full py-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-[var(--text-muted)] hover:text-brand hover:border-brand/50 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> Add Project
                  </motion.button>
                </motion.div>
              )
            })}
          </div>
        </DragDropContext>
      ) : (
        /* List View */
        <Card glass padding="none" className="overflow-hidden border-[var(--border-subtle)]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-white/5 text-[var(--text-muted)] text-[10px] uppercase tracking-widest font-black">
                <th className="p-4 pl-6">Project Details</th>
                <th className="p-4">Client</th>
                <th className="p-4">Deadline</th>
                <th className="p-4">Status</th>
                <th className="p-4">Revenue</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredProjects.map((project) => {
                const client = clients.find(c => c._id === project.clientId)
                const meta = STATUS_META[project.status]
                return (
                  <tr 
                    key={project._id} 
                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    onClick={() => setSelectedProject(project)}
                  >
                    <td className="p-4 pl-6">
                      <span className="font-bold text-[var(--text-primary)]">{project.title}</span>
                    </td>
                    <td className="p-4">
                      {client ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={client.name} src={client.avatarUrl} size="sm" />
                          <span className="text-xs">{client.name}</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="p-4 text-xs text-[var(--text-muted)]">
                      {project.deadline ? formatDate(project.deadline) : '—'}
                    </td>
                    <td className="p-4">
                      <Badge variant={project.status === 'done' ? 'success' : 'brand'}>
                        {meta?.label || project.status}
                      </Badge>
                    </td>
                    <td className="p-4 font-bold text-emerald-400">
                      {formatCurrency(project.paidCents || 0)}
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm">Details</Button>
                        <button 
                          onClick={(e) => handleDeleteProject(project._id, e)} 
                          className="p-2 text-rose-500/50 hover:text-rose-500 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Pagination */}
      {projectsData && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button variant="secondary" size="sm" disabled={!paginationCursor} onClick={() => setPaginationCursor(null)}>
            <ChevronLeft size={16} className="mr-1" /> First Page
          </Button>
          <Button variant="secondary" size="sm" disabled={projectsData.isDone} onClick={() => setPaginationCursor(projectsData.continueCursor)}>
            Next Page <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      )}

      <NewProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {selectedProject && (
        <ProjectDetailsModal 
          isOpen={!!selectedProject} 
          onClose={() => setSelectedProject(null)} 
          project={selectedProject} 
        />
      )}
      
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={performDelete}
        title="Delete Project?"
        description="This will permanently delete the project and all tasks."
        confirmText="Yes, Delete"
        variant="danger"
      />
    </PageWrapper>
  )
}
