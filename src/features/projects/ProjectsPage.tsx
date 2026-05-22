import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/../convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Input } from '@/components/ui/Input';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDate, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { 
  Folder, Plus, Search, CheckCircle2, Circle, Clock, 
  AlertCircle, LayoutGrid, List as ListIcon, 
  MoreVertical, Calendar, DollarSign, Users, Target, Activity, CheckSquare, Tag, Monitor, Link as LinkIcon, MessageSquare
} from 'lucide-react';
import { NewProjectStepperModal } from './NewProjectStepperModal';
import { ProjectDetailsDrawer } from './ProjectDetailsDrawer';
import { DatePicker } from '@/components/ui/DatePicker';

const ITEMS_PER_PAGE = 20;

const PROJECT_CATEGORIES = [
  { slug: 'all', name: 'allStatuses' },
  { slug: 'current', name: 'current' },
  { slug: 'future', name: 'future' },
  { slug: 'postponed', name: 'postponed' },
  { slug: 'completed', name: 'completed' },
];

const PASTEL_COLORS = [
  'bg-orange-50 border-orange-200 text-orange-950',
  'bg-blue-50 border-blue-200 text-blue-950',
  'bg-green-50 border-green-200 text-green-950',
  'bg-purple-50 border-purple-200 text-purple-950',
];

const catTranslations: Record<string, string> = {
  allStatuses: 'كل الحالات',
  current: 'حالي',
  future: 'مستقبلي',
  postponed: 'مؤجل',
  completed: 'مكتمل'
};

export default function ProjectsPage() {
  const { token } = useAuth();
  const { t } = useSettings();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');

  const projectsQuery = useQuery(api.projects.getProjects, token ? {
    token,
    paginationOpts: { numItems: 100, cursor: null }
  } : 'skip');
  
  const updateProjectStatus = useMutation(api.projects.updateProjectStatus);
  const clientsQuery = useQuery(api.clients.getClients, token ? {
    token,
    paginationOpts: { numItems: 1000, cursor: null }
  } : 'skip');

  const staffQuery = useQuery(api.staff.getStaff, token ? { token } : 'skip');

  const updateProjectSteps = useMutation(api.projects.updateProjectSteps);

  const projects = projectsQuery?.page || [];
  const clients = clientsQuery?.page || [];
  const staff = staffQuery || [];

  const filteredProjects = useMemo(() => {
    let result = projects.filter(p => {
      const matchesSearch = !debouncedSearch || p.title?.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const s = p.status;
      const isCurrent = s === 'current' || s === 'active';
      const isFuture = s === 'future' || s === 'draft';
      const isPostponed = s === 'postponed' || s === 'suspended';
      const isCompleted = s === 'completed' || s === 'done';
      
      let matchesStatus = filterStatus === 'all';
      if (filterStatus === 'current') matchesStatus = isCurrent;
      if (filterStatus === 'future') matchesStatus = isFuture;
      if (filterStatus === 'postponed') matchesStatus = isPostponed;
      if (filterStatus === 'completed') matchesStatus = isCompleted;

      const matchesClient = filterClient === 'all' || p.clientId === filterClient;
      const matchesAssignee = filterAssignee === 'all' || p.assignedTo === filterAssignee;
      
      let matchesDate = true;
      if (filterDate) {
        const projectStartStr = p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : '';
        const projectDeadlineStr = p.deadline ? new Date(p.deadline).toISOString().split('T')[0] : '';
        matchesDate = projectStartStr === filterDate || projectDeadlineStr === filterDate;
      }

      return matchesSearch && matchesStatus && matchesClient && matchesAssignee && matchesDate;
    });

    result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return result;
  }, [projects, debouncedSearch, filterStatus, filterClient, filterAssignee, filterDate]);

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

  // onDragEnd removed as Kanban is removed

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

      <div className="flex flex-col gap-4 mb-6" dir="rtl">
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-black/20 p-4 rounded-2xl border border-[var(--border-default)]">
          <div className="flex-1 w-full xl:max-w-md relative">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder={t('searchProjectsPlaceholder') || "بحث في المشاريع..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-4 pr-10 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl text-sm text-white focus:outline-none focus:border-[var(--color-brand)] transition-colors"
            />
          </div>
          
          <div className="flex flex-col lg:flex-row gap-3 w-full xl:w-auto">
            <select 
              value={filterClient} 
              onChange={e => setFilterClient(e.target.value)}
              className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl text-sm font-bold text-white focus:outline-none px-4 py-2 w-full lg:w-auto min-w-[120px]"
            >
              <option value="all">العميل: الكل</option>
              {clients.map((c: any) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>

            <select 
              value={filterAssignee} 
              onChange={e => setFilterAssignee(e.target.value)}
              className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl text-sm font-bold text-white focus:outline-none px-4 py-2 w-full lg:w-auto min-w-[120px]"
            >
              <option value="all">الموظف: الكل</option>
              {staff.map((s: any) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>

            <div className="w-full lg:w-44">
              <DatePicker 
                value={filterDate}
                onChange={setFilterDate}
                placeholder="تاريخ التسليم / البداية"
                withTime={false}
              />
            </div>

            <div className="flex gap-2 items-center overflow-x-auto custom-scrollbar pb-1 sm:pb-0 w-full lg:w-auto shrink-0 mt-2 lg:mt-0">
              {PROJECT_CATEGORIES.map(cat => (
                <button
                  key={cat.slug}
                  onClick={() => setFilterStatus(cat.slug)}
                  className={cn(
                    "px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                    filterStatus === cat.slug 
                      ? "bg-[var(--color-brand)] text-white shadow-lg" 
                      : "bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-muted)] hover:text-white"
                  )}
                >
                  {t(cat.name as any) || catTranslations[cat.name] || cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6 pb-8" dir="rtl">
        {filteredProjects.map((project, index) => (
          <div key={project._id.toString()} className="break-inside-avoid">
            <ProjectMasonryCard 
              project={project} 
              index={index} 
              onClick={() => setSelectedProject(project)}
              onToggleStep={async (stepId) => {
                if (!token) return;
                const updatedSteps = (project.steps || []).map((s: any) => 
                  s.id === stepId ? { ...s, isCompleted: !s.isCompleted } : s
                );
                await updateProjectSteps({
                  token,
                  projectId: project._id,
                  steps: updatedSteps
                });
              }}
            />
          </div>
        ))}
        {filteredProjects.length === 0 && (
          <div className="col-span-full py-20 text-center text-[var(--text-muted)] border-2 border-dashed border-[var(--border-default)] rounded-2xl">
            {t('noProjectsFound' as any)}
          </div>
        )}
      </div>

      <NewProjectStepperModal 
        isOpen={isNewProjectModalOpen} 
        onClose={() => setIsNewProjectModalOpen(false)} 
      />

      <ProjectDetailsDrawer 
        isOpen={!!selectedProject} 
        onClose={() => setSelectedProject(null)} 
        project={selectedProject ? (projects.find(p => p._id === selectedProject._id) || selectedProject) : null} 
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

function ProjectMasonryCard({ project, index, onClick, onToggleStep }: { project: any, index: number, onClick: () => void, onToggleStep: (stepId: string) => void }) {
  const [localSteps, setLocalSteps] = React.useState<any[]>(project.steps || []);
  
  React.useEffect(() => {
    if (project.steps) {
      setLocalSteps(project.steps);
    }
  }, [project.steps]);

  const steps = localSteps;
  const completedSteps = steps.filter((s: any) => s.isCompleted).length;
  const progress = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;
  const { t } = useSettings();
  
  const isCustomColor = !!project.color;
  const colorIndex = project._id ? project._id.charCodeAt(project._id.length - 1) % PASTEL_COLORS.length : 0;
  const cardColorClass = isCustomColor ? `${project.color} text-white border-transparent` : PASTEL_COLORS[colorIndex];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: (index % 10) * 0.05 }}
      onClick={onClick}
      className={cn(
        "group rounded-[24px] border-2 p-5 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden",
        cardColorClass
      )}
    >
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-3 py-1 bg-white/60 border border-white/50 text-xs font-bold rounded-full backdrop-blur-sm shadow-sm">
          #{t(project.projectType as any) || t('project' as any)}
        </span>
        <div className="mr-auto">
          <button className="text-black/40 hover:text-black/70 transition-colors p-1 bg-white/40 rounded-full" onClick={e => e.stopPropagation()}>
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      <h4 className={cn("font-black text-xl mb-3 leading-tight", isCustomColor ? "text-white" : "text-black/80")}>{project.title}</h4>
      
      {project.description && (
        <p className={cn("text-sm mb-4 line-clamp-3 leading-relaxed", isCustomColor ? "text-white/80" : "text-black/60")}>
          {project.description}
        </p>
      )}

      {steps.length > 0 && (
        <div className="bg-white/40 rounded-2xl p-3 mb-4 border border-white/50">
          <div className="flex gap-2 mb-2">
            <div className="w-10 h-6 bg-white/60 rounded-md flex items-center justify-center text-black/50 shadow-sm"><ListIcon size={14} /></div>
            <div className="w-10 h-6 bg-white/60 rounded-md flex items-center justify-center text-black/50 shadow-sm"><CheckSquare size={14} /></div>
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={cn("text-xs font-bold", isCustomColor ? "text-white/80" : "text-black/60")}>{t('progress' as any)}</span>
            <span className={cn("text-xs font-black mr-auto", isCustomColor ? "text-white" : "text-black")}>{progress}%</span>
          </div>
          <div className="flex gap-1 h-2.5">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex-1 rounded-sm transform -skew-x-12",
                  i < Math.floor(progress / 10) ? "bg-black/70" : "bg-black/10"
                )}
              />
            ))}
          </div>

          <div className="space-y-1 mt-3">
            {steps.slice(0, 3).map((step: any) => (
              <div 
                key={step.id} 
                className={cn(
                  "flex items-center gap-2 text-xs p-1.5 rounded-lg transition-colors cursor-pointer",
                  isCustomColor ? "hover:bg-white/10" : "hover:bg-black/5"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  const updatedSteps = localSteps.map((s: any) => 
                    s.id === step.id ? { ...s, isCompleted: !s.isCompleted } : s
                  );
                  setLocalSteps(updatedSteps);
                  onToggleStep(step.id);
                }}
              >
                 {step.isCompleted ? <CheckCircle2 size={14} className={isCustomColor ? "text-white/80" : "text-black/70"} /> : <Circle size={14} className={isCustomColor ? "text-white/50" : "text-black/40"} />}
                 <span className={cn("truncate flex-1 font-medium", step.isCompleted ? (isCustomColor ? "line-through text-white/50" : "line-through text-black/50") : (isCustomColor ? "text-white" : "text-black/80"))}>{step.title}</span>
              </div>
            ))}
            {steps.length > 3 && (
              <div className={cn("text-[10px] text-center pt-1 font-medium", isCustomColor ? "text-white/50" : "text-black/50")}>
                +{steps.length - 3} مهام أخرى
              </div>
            )}
          </div>
        </div>
      )}

      <div className={cn("flex items-center justify-between mt-4 pt-4 border-t", isCustomColor ? "border-white/20" : "border-black/10")}>
        <div className={cn("flex items-center gap-2 text-xs font-bold", isCustomColor ? "text-white/70" : "text-black/50")}>
          <Calendar size={12} className={isCustomColor ? "text-white/60" : "text-black/40"} />
          {project.deadline ? new Date(project.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '--/--'}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-black/50 text-xs font-bold" title={t('links' as any)}>
            <LinkIcon size={12} /> {project.steps?.length || 0}
          </div>
          <div className="flex items-center gap-1 text-black/50 text-xs font-bold" title={t('comments' as any)}>
            <MessageSquare size={12} /> {Math.floor(Math.random() * 5)}
          </div>
          <div className="w-8 h-8 rounded-full bg-white/80 border-2 border-white flex items-center justify-center text-[10px] font-black text-black/70 shadow-sm" title={project.assignedTo}>
            {project.assignedTo ? project.assignedTo.charAt(0).toUpperCase() : '?'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
