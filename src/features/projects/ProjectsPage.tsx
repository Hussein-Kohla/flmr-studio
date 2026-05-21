import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { api } from '@/../convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Input } from '@/components/ui/Input';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDate, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { 
  Folder, Plus, Search, CheckCircle2, Clock, 
  AlertCircle, LayoutGrid, List as ListIcon, 
  MoreVertical, Calendar, DollarSign, Users, Target, Activity, CheckSquare, Tag, Monitor
} from 'lucide-react';
import { NewProjectStepperModal } from './NewProjectStepperModal';
import { ProjectDetailsDrawer } from './ProjectDetailsDrawer';

const ITEMS_PER_PAGE = 20;

const STAGE_CONFIG = [
  { slug: 'draft', name: 'draft', color: 'border-slate-500', icon: Clock },
  { slug: 'in_review', name: 'inReview', color: 'border-blue-500', icon: AlertCircle },
  { slug: 'revision', name: 'revision', color: 'border-amber-500', icon: AlertCircle },
  { slug: 'approved', name: 'approved', color: 'border-purple-500', icon: CheckCircle2 },
  { slug: 'done', name: 'completed', color: 'border-[var(--color-brand)]', icon: CheckCircle2 },
];

export default function ProjectsPage() {
  const { token } = useAuth();
  const { t } = useSettings();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const projectsQuery = useQuery(api.projects.getProjects, token ? {
    token,
    paginationOpts: { numItems: 100, cursor: null }
  } : 'skip');
  
  const clientsQuery = useQuery(api.clients.getClients, token ? {
    token,
    paginationOpts: { numItems: 100, cursor: null }
  } : 'skip');

  const updateProjectStatus = useMutation(api.projects.updateProjectStatus);

  const projects = projectsQuery?.page || [];
  const clients = clientsQuery?.page || [];

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = !debouncedSearch || p.title?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      const matchesType = filterType === 'all' || p.projectType === filterType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [projects, debouncedSearch, filterStatus, filterType]);

  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter(p => p.status !== 'done').length;
    const completed = projects.filter(p => p.status === 'done').length;
    const totalRevenue = projects.reduce((sum, p) => sum + (p.budgetCents || 0), 0);
    
    let totalMonths = 1;
    if (projects.length > 0) {
      const oldestProject = [...projects].sort((a, b) => a.createdAt - b.createdAt)[0];
      const msPerMonth = 1000 * 60 * 60 * 24 * 30;
      const monthsSinceOldest = (Date.now() - oldestProject.createdAt) / msPerMonth;
      totalMonths = Math.max(1, Math.ceil(monthsSinceOldest));
    }
    const averageMonthly = totalRevenue / totalMonths;

    return {
      total,
      active,
      completed,
      averageMonthly,
      totalClients: clients.length
    };
  }, [projects, clients]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !token) return;
    const { draggableId, destination } = result;

    const project = projects.find(p => p._id.toString() === draggableId);
    if (project && project.status !== destination.droppableId) {
      updateProjectStatus({
        token,
        projectId: project._id,
        status: destination.droppableId
      }).catch(console.error);
    }
  };

  return (
    <PageWrapper
      title={
        <div className="flex items-center gap-3">
          <Folder className="text-[var(--color-brand)]" size={28} />
          <div dir="rtl">
            <h1 className="text-2xl font-black text-white">{t('projects')}</h1>
            <p className="text-sm text-[var(--text-muted)] font-normal">{t('projectsSubtitle')}</p>
          </div>
        </div>
      }
      actions={
        <div className="flex gap-3 items-center">
          <div className="flex bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-default)]">
            <button onClick={() => setViewMode('kanban')} className={cn("p-2 rounded-lg transition-all", viewMode === 'kanban' ? 'bg-[var(--color-brand)] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-white')}>
              <LayoutGrid size={18} />
            </button>
            <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? 'bg-[var(--color-brand)] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-white')}>
              <ListIcon size={18} />
            </button>
          </div>
          <button 
            onClick={() => setIsNewProjectModalOpen(true)}
            className="flex items-center gap-2 bg-[var(--color-brand)] hover:bg-[var(--color-brand-dim)] text-white px-5 py-2.5 rounded-full font-bold transition-all shadow-[0_0_20px_var(--color-brand-glow)]"
          >
            <Plus size={18} /> {t('newProject')}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8" dir="rtl">
        <StatCard title={t('total')} value={stats.total} icon={<Folder size={18} />} color="border-[var(--text-muted)]" />
        <StatCard title={t('active')} value={stats.active} icon={<Activity size={18} />} color="border-blue-500" valueColor="text-blue-500" />
        <StatCard title={t('completed')} value={stats.completed} icon={<CheckCircle2 size={18} />} color="border-[var(--color-brand)]" valueColor="text-[var(--color-brand)]" />
        <StatCard title={t('average')} value={formatCurrency(stats.averageMonthly)} icon={<DollarSign size={18} />} color="border-purple-500" valueColor="text-purple-400" />
        <StatCard title={t('clientsCount')} value={stats.totalClients} icon={<Users size={18} />} color="border-pink-500" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6 border-y border-[var(--border-default)] py-4 bg-black/20" dir="rtl">
        <div className="flex-1 max-w-md relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder={t('searchProjectsPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-4 pr-10 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl text-sm text-white focus:outline-none focus:border-[var(--color-brand)] transition-colors"
          />
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-10 px-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl text-sm text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-brand)]">
            <option value="all">{t('allStatuses')} ▼</option>
            {STAGE_CONFIG.map(s => <option key={s.slug} value={s.slug}>{t(s.name as any)}</option>)}
          </select>
          <select className="h-10 px-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl text-sm text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-brand)]">
            <option value="all">{t('allClients')} ▼</option>
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="h-10 px-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl text-sm text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-brand)]">
            <option value="all">{t('allTypes')} ▼</option>
            <option value="web">{t('web')}</option>
            <option value="mobile">{t('mobile')}</option>
          </select>
          <select className="h-10 px-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl text-sm text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-brand)]">
            <option value="recent">{t('newest')} ▼</option>
            <option value="oldest">{t('oldest')}</option>
          </select>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 overflow-x-auto pb-8 items-start custom-scrollbar min-h-[600px]" dir="ltr">
            {STAGE_CONFIG.map((stage) => {
              const columnProjects = filteredProjects.filter(p => p.status === stage.slug);
              return (
                <div key={stage.slug} className="flex flex-col w-[320px] shrink-0 bg-transparent rounded-2xl">
                  <div className="flex items-center justify-between mb-4 px-1" dir="rtl">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full border-2", stage.color, stage.slug === 'done' ? 'bg-[var(--color-brand)]' : 'bg-transparent')} />
                      <h3 className="font-bold text-white text-sm uppercase tracking-wider">{t(stage.name as any)}</h3>
                    </div>
                    <span className="text-xs font-bold bg-[var(--bg-surface)] text-[var(--text-muted)] px-2 py-1 rounded-full border border-[var(--border-default)]">
                      {columnProjects.length}
                    </span>
                  </div>

                  <Droppable droppableId={stage.slug}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={cn(
                          "flex-1 rounded-2xl min-h-[150px] transition-colors p-2 space-y-3",
                          snapshot.isDraggingOver ? 'bg-white/5 border border-dashed border-white/20' : 'bg-transparent'
                        )}
                        dir="rtl"
                      >
                        {columnProjects.map((project, index) => (
                          <KanbanCard 
                            key={project._id.toString()} 
                            project={project} 
                            index={index} 
                            onClick={() => setSelectedProject(project)}
                          />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      ) : (
        <div className="text-center py-20 text-[var(--text-muted)]">{t("listViewUnderConstruction")}</div>
      )}

      <NewProjectStepperModal 
        isOpen={isNewProjectModalOpen} 
        onClose={() => setIsNewProjectModalOpen(false)} 
      />

      <ProjectDetailsDrawer 
        isOpen={!!selectedProject} 
        onClose={() => setSelectedProject(null)} 
        project={selectedProject} 
      />
    </PageWrapper>
  );
}

function StatCard({ title, value, icon, color, valueColor = "text-white" }: { title: string, value: string|number, icon: React.ReactNode, color: string, valueColor?: string }) {
  return (
    <div className={cn("bg-[var(--bg-surface)] p-5 rounded-2xl border-b-4 border-x border-t border-[var(--border-default)] relative overflow-hidden group hover:bg-[var(--bg-muted)] transition-colors", color)}>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center text-[var(--text-muted)] group-hover:text-white transition-colors border border-[var(--border-default)]">
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <h3 className={cn("text-2xl font-black mb-1 font-mono tracking-tight", valueColor)}>{value}</h3>
        <p className="text-xs font-bold text-[var(--text-muted)] uppercase">{title}</p>
      </div>
    </div>
  );
}

function KanbanCard({ project, index, onClick }: { project: any, index: number, onClick: () => void }) {
  const steps = project.steps || [];
  const completedSteps = steps.filter((s: any) => s.isCompleted).length;
  const progress = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;
  const { t } = useSettings();
  
  const priorityColors: Record<string, string> = {
    low: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    high: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    critical: 'text-red-400 bg-red-400/10 border-red-400/20'
  };

  return (
    <Draggable draggableId={project._id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={cn(
            "group bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-4 cursor-pointer hover:border-[var(--color-brand)]/50 hover:shadow-xl hover:shadow-[var(--color-brand-glow)]/5 transition-all",
            snapshot.isDragging && "shadow-2xl ring-2 ring-[var(--color-brand)]/50 scale-[1.02] rotate-1"
          )}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2 max-w-[85%]">
              <div 
                className="w-6 h-6 rounded flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: project.color ? project.color.replace('bg-', '') : 'var(--color-brand)' }}
              >
                <Monitor size={12} />
              </div>
              <h4 className="text-white font-bold text-sm truncate">{project.title}</h4>
            </div>
            <button className="text-[var(--text-muted)] hover:text-white transition-colors p-1" onClick={e => e.stopPropagation()}>
              <MoreVertical size={14} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white border-2 border-[var(--bg-surface)] shrink-0" title={project.assignedTo}>
              {project.assignedTo ? project.assignedTo.charAt(0).toUpperCase() : '?'}
            </div>
            <span className="text-[10px] font-medium text-[var(--text-muted)] truncate max-w-[80px]">
              {project.assignedTo || t('unassigned')}
            </span>
            <span className="text-[10px] bg-black px-2 py-0.5 rounded-full border border-[var(--border-default)] text-[var(--text-muted)]">
              {project.projectType === 'web' ? `🌐 ${t('web')}` : project.projectType === 'mobile' ? `📱 ${t('mobile')}` : `🎨 ${t('design')}`}
            </span>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-[var(--text-muted)] font-medium tracking-widest">{t("progressUppercase")}</span>
              <span className="text-white font-bold">{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-black rounded-full overflow-hidden border border-[var(--border-default)]">
              <div 
                className="h-full bg-[var(--color-brand)] rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[var(--border-default)]">
            <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
              <span className="flex items-center gap-1" title={t('deadline')}>
                <Calendar size={12} />
                {project.deadline ? new Date(project.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '--/--'}
              </span>
              {project.budgetCents ? (
                <span className="flex items-center gap-1 font-bold text-[var(--color-brand)]" title={t('budget')}>
                  <DollarSign size={12} />
                  {project.budgetCents / 100}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                <CheckSquare size={12} />
                {completedSteps}/{steps.length}
              </span>
              <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", priorityColors[project.priority || 'medium'])}>
                {project.priority === 'high' || project.priority === 'critical' ? '🔴' : '🟡'} {t(project.priority as any || 'medium')}
              </span>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
