import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { formatCurrency, cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  Users, LayoutGrid, List as ListIcon, Plus, Search, 
  ChevronDown, ChevronRight, Folder, MoreHorizontal, 
  BarChart2, Phone, Mail, CheckCircle2, AlertTriangle, 
  Clock, XCircle, FileText, Wallet
} from 'lucide-react';
import { NewClientModal } from './NewClientModal';
import { NewStaffModal } from './NewStaffModal';
import { NewEventModal } from '../calendar/NewEventModal';

const ITEMS_PER_PAGE = 20;

const STATUS_COLORS: Record<string, string> = {
  'in_review': 'text-[#3b82f6] bg-[#1e3a5f]',
  'done': 'text-[var(--color-brand)] bg-[#064e3b]',
  'at_risk': 'text-[#f59e0b] bg-[#451a03]',
  'revision': 'text-[#8b5cf6] bg-[#2e1065]',
  'draft': 'text-[#6b7280] bg-[#1f2937]',
  'approved': 'text-[var(--color-brand)] bg-[#064e3b]'
};

const HEALTH_COLORS: Record<string, string> = {
  'Good': 'bg-emerald-100 text-emerald-700',
  'At risk': 'bg-amber-100 text-amber-700',
  'Off track': 'bg-red-100 text-red-700',
  'Not set': 'bg-gray-100 text-gray-500'
};

export default function ClientsPage() {
  const { token } = useAuth();
  const { t } = useSettings();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isNewStaffOpen, setIsNewStaffOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'clients' | 'staff'>('clients');

  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [eventInitialClientId, setEventInitialClientId] = useState('');
  const [staffToEdit, setStaffToEdit] = useState<any | null>(null);

  const staffQuery = useQuery(api.staff.getStaff as any, token ? { token } : 'skip');
  const staffList = staffQuery || [];
  const clientsQuery = useQuery(api.clients.getClients, token ? { token, paginationOpts: { numItems: 100, cursor: null } } : 'skip');
  const projectsQuery = useQuery(api.projects.getProjects, token ? { token, paginationOpts: { numItems: 1000, cursor: null } } : 'skip');
  const transactionsQuery = useQuery(api.transactions.getTransactions, token ? { token, paginationOpts: { numItems: 1000, cursor: null } } : 'skip');
  const paymentsQuery = useQuery((api as any).payments?.getPayments, token ? { token, paginationOpts: { numItems: 1000, cursor: null } } : 'skip');

  const clients = clientsQuery?.page || [];
  const projects = projectsQuery?.page || [];
  const transactions = transactionsQuery?.page || [];
  const payments = paymentsQuery?.page || [];

  // Derived Data
  const getClientFinancials = (clientId: string) => {
    const txs = transactions.filter(t => t.clientId === clientId && (t.status === 'paid' || t.status === 'posted'));
    const total = txs.reduce((sum, t) => sum + (t.amountCents || 0), 0);
    const months = Math.max(1, txs.length); 
    return { total, avg: total / months };
  };

  const getClientProjects = (clientId: string) => {
    return projects.filter(p => p.clientId === clientId);
  };

  const getStaffProjects = (staffId: string) => {
    return projects.filter(p => p.assignedTo === staffId);
  };

  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const allTags = useMemo(() => {
    return Array.from(new Set(clients.flatMap(c => c.tags || [])));
  }, [clients]);

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const q = debouncedSearch.toLowerCase();
      const matchesSearch = !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q);
      const matchesTag = selectedTag === 'all' || (c.tags || []).includes(selectedTag);
      const matchesType = selectedType === 'all' || c.clientType === selectedType;
      const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
      return matchesSearch && matchesTag && matchesType && matchesStatus;
    });
  }, [clients, debouncedSearch, selectedTag, selectedType, selectedStatus]);

  const activeProjectsCount = projects.filter(p => p.status !== 'done').length;
  const totalAverageMonthly = clients.reduce((sum, c) => sum + getClientFinancials(c._id).avg, 0);
  const totalPaidAmount = transactions.filter((t: any) => t.status === 'paid' || t.status === 'posted').reduce((sum: number, t: any) => sum + (t.amountCents || 0), 0);
  const avgMonthlyIncome = clients.length > 0 ? totalAverageMonthly / clients.length : 0;
  const totalPendingAmount = transactions.filter((t: any) => t.status === 'pending').reduce((sum: number, t: any) => sum + (t.amountCents || 0), 0);

  return (
    <PageWrapper
      title={
        <div className="flex items-center gap-3">
          <Users className="text-[var(--color-brand)]" size={28} />
          <div dir="rtl">
            <h1 className="text-2xl font-black text-white">{t('clients')}</h1>
            <p className="text-sm text-[var(--text-muted)] font-normal">{clients.length} {t('clientsInNetwork')}</p>
          </div>
        </div>
      }
      actions={
        <div className="flex gap-3 items-center">
          <button onClick={() => navigate('/clients/analytics')} className="flex items-center gap-2 text-[var(--text-muted)] hover:text-white transition-colors bg-[var(--bg-surface)] px-4 py-2.5 rounded-xl border border-[var(--border-default)]">
            {t('analytics')} <BarChart2 size={16} />
          </button>
          
          <div className="flex bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-default)]">
            <button onClick={() => setViewMode('grid')} className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? 'bg-[var(--color-brand)] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-white')}>
              <LayoutGrid size={18} />
            </button>
            <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? 'bg-[var(--color-brand)] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-white')}>
              <ListIcon size={18} />
            </button>
          </div>
          
          <button 
            onClick={() => setIsNewClientOpen(true)}
            className="flex items-center gap-2 bg-[var(--color-brand)] hover:bg-[var(--color-brand-dim)] text-white px-5 py-2.5 rounded-full font-bold transition-all shadow-[var(--color-brand-glow)]"
          >
            <Plus size={18} /> {t('newClient')}
          </button>
          <button 
            onClick={() => setIsNewStaffOpen(true)}
            className="flex items-center gap-2 bg-[#1f2937] hover:bg-[#374151] text-white px-5 py-2.5 rounded-full font-bold transition-all border border-white/10"
          >
            <Plus size={18} /> {t('addStaff') || 'إضافة موظف'}
          </button>
        </div>
      }
    >
      <div className="flex gap-4 mb-6" dir="rtl">
        <button onClick={() => { setActiveTab('clients'); setViewMode('grid'); }} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'clients' ? 'bg-[var(--color-brand)] text-white shadow-lg' : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-white'}`}>{t('clients')}</button>
        <button onClick={() => { setActiveTab('staff'); setViewMode('grid'); }} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'staff' ? 'bg-[var(--color-brand)] text-white shadow-lg' : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-white'}`}>{t('staffLabel') || 'فريق العمل'}</button>
      </div>
      
      {activeTab === 'clients' ? (
      <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8" dir="rtl">
        <StatCard title="TOTAL CLIENTS" value={clients.length} />
        <StatCard title="ACTIVE PROJECTS" value={activeProjectsCount} />
        <StatCard title="TOTAL PAID AMOUNT" value={`${formatCurrency(totalPaidAmount)}`} highlight />
        <StatCard title="AVG. MONTHLY INCOME" value={`${formatCurrency(avgMonthlyIncome)}`} highlight />
        <StatCard title="PENDING AMOUNT" value={`${formatCurrency(totalPendingAmount)}`} highlight />
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6" dir="rtl">
        <div className="flex-1 max-w-md relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder={t('searchClientsPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-4 pr-10 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl text-sm text-white focus:outline-none focus:border-[var(--color-brand)] transition-colors"
          />
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <select 
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="h-10 px-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl text-sm text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-brand)]"
          >
            <option value="all">{t('allTags') || 'كل التصنيفات'} ▼</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] border-dashed">
          <Users size={48} className="text-[var(--text-muted)] mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">{t('noClientsFound')}</h3>
          <p className="text-[var(--text-muted)] mb-6">{t('noClientsYet')}</p>
          <button onClick={() => setIsNewClientOpen(true)} className="bg-[var(--color-brand)] text-white px-6 py-2 rounded-xl font-bold">
            {t('addFirstClient')}
          </button>
        </div>
      ) : (
        viewMode === 'list' ? (
          <ListView 
            clients={filteredClients} 
            getProjects={getClientProjects} 
            getFinancials={getClientFinancials} 
            onClientClick={(client: any) => navigate(`/clients/${client._id}`)}
            onProjectClick={(pId: any) => navigate('/projects')}
          />
        ) : (
          <GridView 
            clients={filteredClients} 
            getProjects={getClientProjects} 
            getFinancials={getClientFinancials} 
            onClientClick={(client: any) => navigate(`/clients/${client._id}`)}
            onProjectClick={(pId: any) => navigate('/projects')}
            onAddProject={(cId: string) => {
              setEventInitialClientId(cId);
              setIsNewEventOpen(true);
            }}
          />
        )
      )}

      </>
      ) : staffList.length === 0 ? (
        <div className="py-12 text-center text-white/50 bg-white/5 rounded-2xl border border-dashed border-white/10" dir="rtl">
          لا يوجد موظفين مضافين بعد
        </div>
      ) : viewMode === 'list' ? (
        <StaffListView
          staff={staffList}
          getProjects={getStaffProjects}
          onStaffClick={(st: any) => { setStaffToEdit(st); setIsNewStaffOpen(true); }}
        />
      ) : (
        <StaffGridView
          staff={staffList}
          getProjects={getStaffProjects}
          onStaffClick={(st: any) => { setStaffToEdit(st); setIsNewStaffOpen(true); }}
          onProjectClick={(pId: any) => navigate('/projects')}
          onAddProject={(staffId: string) => {
            setIsNewEventOpen(true);
          }}
        />
      )}

      <NewStaffModal 
        isOpen={isNewStaffOpen} 
        onClose={() => { setIsNewStaffOpen(false); setStaffToEdit(null); }} 
        staffToEdit={staffToEdit}
      />
      <NewClientModal isOpen={isNewClientOpen} onClose={() => setIsNewClientOpen(false)} />
      <NewEventModal 
        isOpen={isNewEventOpen} 
        onClose={() => setIsNewEventOpen(false)} 
        initialCategory="project"
        initialClientId={eventInitialClientId}
        allowedCategories={['project']}
      />
    </PageWrapper>
  );
}

function StaffAvatar({ staff, size = 'md' }: { staff: any; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-10 h-10 text-sm' : 'w-20 h-20 text-xl';
  return (
    <div className={cn(sizeClass, 'rounded-full p-1 transition-all duration-300 flex-shrink-0')} style={{ backgroundImage: `linear-gradient(to top right, ${staff.color || '#8b5cf6'}, #4f46e5)` }}>
      <div className="w-full h-full rounded-full bg-[var(--bg-raised)] p-1 overflow-hidden flex items-center justify-center relative">
        <div className={cn('w-full h-full rounded-full bg-[var(--bg-surface)] flex items-center justify-center font-black text-[var(--text-muted)] uppercase absolute inset-0 z-0', size === 'sm' ? 'text-xs' : 'text-xl')}>
          {staff.name ? staff.name.slice(0, 2) : '?'}
        </div>
        {staff.avatarUrl && (
          <img
            src={staff.avatarUrl}
            alt={staff.name}
            className="w-full h-full object-cover rounded-full absolute inset-0 z-10"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
      </div>
    </div>
  );
}

function StaffListView({ staff, getProjects, onStaffClick }: { staff: any[]; getProjects?: any; onStaffClick: (st: any) => void }) {
  const { t } = useSettings();
  return (
    <div className="w-full bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-2xl overflow-hidden" dir="rtl">
      <div className="grid grid-cols-[auto_1fr] gap-4 p-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-muted)]">
        <div className="w-10" />
        <div>{t('clientNameLabel')}</div>
      </div>
      <div className="divide-y divide-[var(--border-default)]">
        {staff.map((st) => (
          <div
            key={st._id}
            className="grid grid-cols-[auto_1fr] gap-4 p-4 items-center cursor-pointer bg-[var(--bg-base)] hover:bg-[var(--bg-overlay)] transition-colors"
            onClick={() => onStaffClick(st)}
          >
            <StaffAvatar staff={st} size="sm" />
            <span className="font-bold text-sm text-white hover:text-[var(--color-brand)] transition-colors">{st.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StaffGridView({ staff, getProjects, onStaffClick, onProjectClick, onAddProject }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4" dir="rtl">
      {staff.map((st: any) => (
        <StaffGridCard 
          key={st._id} 
          staff={st}
          projects={getProjects ? getProjects(st._id) : []}
          onStaffClick={() => onStaffClick(st)}
          onProjectClick={onProjectClick}
          onAddProject={onAddProject}
        />
      ))}
    </div>
  );
}

function StaffGridCard({ staff, projects, onStaffClick, onProjectClick, onAddProject }: any) {
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(false);
  const { t } = useSettings();

  const getStatusTranslationKey = (status: string) => {
    const mapping: Record<string, string> = {
      'in_review': 'inReview',
      'done': 'done',
      'at_risk': 'atRisk',
      'revision': 'revision',
      'draft': 'draft',
      'approved': 'approved'
    };
    return mapping[status] || 'draft';
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl hover:border-[var(--color-brand)] transition-all flex flex-col p-6">
      <div className="flex flex-col items-center gap-4 cursor-pointer mb-6" onClick={onStaffClick}>
        <StaffAvatar staff={staff} />
        <div className="text-center">
          <h3 className="text-lg font-bold text-white hover:text-[var(--color-brand)] transition-colors">{staff.name}</h3>
        </div>
      </div>

      <div className="h-px bg-[var(--border-default)] w-full my-4" />

      <button 
        onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
        className="flex items-center justify-between w-full py-2 text-sm font-bold text-white hover:text-[var(--color-brand)] transition-colors group"
      >
        <span className="flex items-center gap-2">
          <motion.div animate={{ rotate: isProjectsExpanded ? 90 : 0 }} className="text-[var(--text-muted)] group-hover:text-[var(--color-brand)]">
            <ChevronRight size={16} />
          </motion.div>
          {t('projects')} ({projects.length})
        </span>
      </button>

      <AnimatePresence>
        {isProjectsExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-xl mt-3 overflow-hidden">
              {projects.length === 0 ? (
                <div className="p-4 text-center text-xs text-[var(--text-muted)]">{t('noProjectsLinked')}</div>
              ) : (
                <div className="divide-y divide-[var(--border-default)]">
                  {projects.map((project: any) => {
                    const statusKey = getStatusTranslationKey(project.status);
                    const statusLabel = t(statusKey as any);
                    const statusColor = STATUS_COLORS[project.status] || STATUS_COLORS['draft'];
                    
                    const pTotalTasks = project.steps?.length || 0;
                    const pCompletedTasks = project.steps?.filter((s:any) => s.isCompleted).length || 0;
                    const pRatio = pTotalTasks > 0 ? Math.round((pCompletedTasks / pTotalTasks) * 100) : 0;

                    return (
                      <div key={project._id} className="p-3 hover:bg-[var(--bg-overlay)] transition-colors cursor-pointer" onClick={() => onProjectClick(project._id)}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Folder size={12} className="text-[var(--text-muted)]" />
                            <span className="text-xs font-bold text-white truncate max-w-[120px]">{project.title}</span>
                          </div>
                          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-md", statusColor)}>
                            {statusLabel}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-[var(--border-default)] flex items-center justify-center text-[8px] text-white">ي</div>
                            <span className="text-[10px] text-[var(--text-muted)]">يوسف</span>
                          </div>
                          <span className="text-[10px] text-[var(--text-muted)]">{pRatio}%</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex-1 max-w-[60%] h-1 bg-[var(--border-default)] rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--color-brand)] transition-all" style={{ width: `${pRatio}%` }} />
                          </div>
                          <span className="text-[9px] text-[var(--text-muted)] font-mono">
                            {pCompletedTasks}/{pTotalTasks} {t('todo')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="p-2 border-t border-[var(--border-default)] bg-[var(--bg-base)]">
                <button onClick={(e) => { e.stopPropagation(); onAddProject(staff._id); }} className="w-full py-1 text-xs text-[var(--color-brand)] hover:bg-[var(--color-brand)]/10 rounded font-bold transition-colors">
                  + {t('addProject')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, highlight = false }: { title: string, value: string | number, highlight?: boolean }) {
  const { t, language } = useSettings();
  const localizedTitle = title === 'TOTAL CLIENTS' ? t('totalClients') : 
                         title === 'ACTIVE PROJECTS' ? t('activeProjects') :
                         title === 'TOTAL PAID AMOUNT' ? (language === 'ar' ? 'إجمالي المدفوع' : 'Total Paid Amount') :
                         title === 'PENDING AMOUNT' ? (language === 'ar' ? 'المبالغ المعلقة' : 'Pending Amounts') :
                         t('avgMonthlyIncome');

  return (
    <div className="bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border-default)] flex flex-col justify-center items-center text-center">
      <p className="text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest">{localizedTitle}</p>
      <h3 className={cn("text-2xl font-black font-mono tracking-tight", highlight ? "text-[var(--color-brand)]" : "text-white")}>
        {value}
      </h3>
    </div>
  );
}

function ListView({ clients, getProjects, getFinancials, onClientClick, onProjectClick }: any) {
  const { t } = useSettings();
  return (
    <div className="w-full bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-2xl overflow-hidden" dir="rtl">
      <div className="grid grid-cols-[auto_2fr_1fr_1fr_1fr_1fr] gap-4 p-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-muted)]">
        <div className="w-6"></div>
        <div>{t('clientName')}</div>
        <div>{t('assignee')}</div>
        <div>{t('projectsCount')}</div>
        
        
        <div>{t('budget')}</div>
        <div>{t('average')}</div>
        
      </div>
      
      <div className="divide-y divide-[var(--border-default)]">
        {clients.map((client: any) => (
          <ExpandableClientRow 
            key={client._id} 
            client={client} 
            projects={getProjects(client._id)} 
            financials={getFinancials(client._id)}
            onClientClick={() => onClientClick(client)}
            onProjectClick={onProjectClick}
          />
        ))}
      </div>
    </div>
  );
}

function ExpandableClientRow({ client, projects, financials, onClientClick, onProjectClick }: any) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useSettings();
  
  const totalTasks = projects.reduce((sum: number, p: any) => sum + (p.steps?.length || 0), 0);
  const completedTasks = projects.reduce((sum: number, p: any) => sum + (p.steps?.filter((s:any) => s.isCompleted).length || 0), 0);
  const taskRatio = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const remainingTasks = totalTasks - completedTasks;
  const totalBudget = projects.reduce((sum: number, p: any) => sum + (p.budgetCents || 0), 0);

  const healthStatus = taskRatio > 70 ? 'Good' : taskRatio > 30 ? 'At risk' : 'Off track';

  return (
    <div className="group bg-[var(--bg-base)] hover:bg-[var(--bg-overlay)] transition-colors">
      <div className="grid grid-cols-[auto_2fr_1fr_1fr_1fr_1fr] gap-4 p-4 items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="w-6 flex justify-center text-[var(--text-muted)]">
          <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
            <ChevronRight size={16} />
          </motion.div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full p-[2px] transition-all duration-300 flex-shrink-0 cursor-pointer" style={{ backgroundImage: `linear-gradient(to top right, ${client.color || '#8b5cf6'}, #4f46e5)` }} onClick={(e) => { e.stopPropagation(); onClientClick(); }}>
            <div className="w-full h-full rounded-full bg-[var(--bg-raised)] p-[2px] overflow-hidden flex items-center justify-center relative">
              <div className="w-full h-full rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-xs font-bold text-white uppercase absolute inset-0 z-0">
                {client.name?.charAt(0)}
              </div>
              {client.avatarUrl && (
                <img 
                  src={client.avatarUrl} 
                  alt={client.name} 
                  className="w-full h-full object-cover rounded-full absolute inset-0 z-10" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </div>
          </div>
          <span className="font-bold text-sm text-white hover:text-[var(--color-brand)] transition-colors" onClick={(e) => { e.stopPropagation(); onClientClick(); }}>{client.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[var(--border-default)] flex items-center justify-center text-[10px] text-white">ي</div>
        </div>

        <div className="text-sm font-bold text-white">{projects.length}</div>





        <div className="flex items-center gap-2">
          <div className="flex-1 max-w-[60px] h-1.5 rounded-full overflow-hidden bg-[var(--border-default)] flex">
            <div className="h-full bg-[var(--color-brand)] w-full" />
          </div>
          <span className="text-xs font-bold text-[var(--color-brand)]">{formatCurrency(totalBudget)}</span>
        </div>

        <div className="text-sm font-bold text-[var(--color-brand)]">
          {formatCurrency(financials.avg)}
        </div>


      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[var(--bg-raised)]"
          >
            {projects.length === 0 ? (
              <div className="p-4 text-center text-xs text-[var(--text-muted)] italic pr-14">
                {t('noProjectsLinked')}
              </div>
            ) : (
              <div className="flex flex-col">
                {projects.map((project: any, idx: number) => {
                  const pTotalTasks = project.steps?.length || 0;
                  const pCompletedTasks = project.steps?.filter((s:any) => s.isCompleted).length || 0;
                  const pRatio = pTotalTasks > 0 ? Math.round((pCompletedTasks / pTotalTasks) * 100) : 0;
                  const pRemaining = pTotalTasks - pCompletedTasks;
                  
                  const pHealth = pRatio === 100 ? 'Good' : pRatio > 50 ? 'Good' : project.status === 'at_risk' ? 'Off track' : 'At risk';

                  return (
                    <div key={project._id} className="grid grid-cols-[auto_2fr_1fr_1fr_1fr_1fr] gap-4 p-3 items-center border-t border-[var(--border-default)]/50 relative hover:bg-[var(--bg-surface)]">
                      <div className="w-6 flex justify-end">
                         <div className={cn("w-4 border-l-2 border-b-2 border-[var(--border-default)] rounded-bl-lg absolute right-5", idx === projects.length - 1 ? "top-0 h-1/2" : "inset-y-0")} />
                      </div>
                      
                      <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onProjectClick(project._id)}>
                        <Folder size={14} className="text-[var(--text-muted)] group-hover:text-[var(--color-brand)]" />
                        <span className="font-semibold text-xs text-[var(--text-muted)] group-hover:text-white transition-colors">{project.title}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[var(--border-default)] flex items-center justify-center text-[9px] text-white">
                          {project.assignedTo ? project.assignedTo.charAt(0) : '—'}
                        </div>
                      </div>

                      <div className="text-xs text-[var(--text-muted)]">—</div>





                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-[var(--text-muted)]">{formatCurrency(project.budgetCents || 0)}</span>
                      </div>

                      <div className="text-xs text-[var(--text-muted)]">—</div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GridView({ clients, getProjects, getFinancials, onClientClick, onProjectClick, onAddProject }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" dir="rtl">
      {clients.map((client: any) => (
        <GridCard 
          key={client._id} 
          client={client} 
          projects={getProjects(client._id)} 
          financials={getFinancials(client._id)}
          onClientClick={() => onClientClick(client)}
          onProjectClick={onProjectClick}
          onAddProject={onAddProject}
        />
      ))}
    </div>
  );
}

function GridCard({ client, projects, financials, onClientClick, onProjectClick, onAddProject }: any) {
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(false);
  const { t, language } = useSettings();
  const navigate = useNavigate();

  const getStatusTranslationKey = (status: string) => {
    const mapping: Record<string, string> = {
      'in_review': 'inReview',
      'done': 'done',
      'at_risk': 'atRisk',
      'revision': 'revision',
      'draft': 'draft',
      'approved': 'approved'
    };
    return mapping[status] || 'draft';
  };

  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-6 flex flex-col hover:border-[var(--color-brand)]/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all">
      <div className="flex flex-col items-center mb-6 cursor-pointer" onClick={onClientClick}>
        <div className="w-20 h-20 rounded-full p-1 mb-3 transition-all duration-300" style={{ backgroundImage: `linear-gradient(to top right, ${client.color || '#8b5cf6'}, #4f46e5)` }}>
          <div className="w-full h-full rounded-full bg-[var(--bg-raised)] p-1 overflow-hidden flex items-center justify-center relative">
            <div className="w-full h-full rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-3xl font-bold text-white uppercase absolute inset-0 z-0">
              {client.name?.charAt(0)}
            </div>
            {client.avatarUrl && (
              <img 
                src={client.avatarUrl} 
                alt={client.name} 
                className="w-full h-full object-cover rounded-full absolute inset-0 z-10" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>
        </div>
        <h3 className="text-xl font-bold text-white text-center hover:text-[var(--color-brand)] transition-colors">{client.name}</h3>
        {client.company && <p className="text-sm text-[var(--text-muted)] mt-1">{client.company}</p>}
      </div>

      <div className="flex flex-col gap-2 mb-6">
        {client.email && (
          <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
            <Mail size={14} className="text-[var(--color-brand)]" /> {client.email}
          </div>
        )}
        {client.phone && (
          <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
            <Phone size={14} className="text-[var(--color-brand)]" /> {client.phone}
          </div>
        )}
      </div>

      <div className="h-px bg-[var(--border-default)] w-full my-4" />

      <button 
        onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
        className="flex items-center justify-between w-full py-2 text-sm font-bold text-white hover:text-[var(--color-brand)] transition-colors group"
      >
        <span className="flex items-center gap-2">
          <motion.div animate={{ rotate: isProjectsExpanded ? 90 : 0 }} className="text-[var(--text-muted)] group-hover:text-[var(--color-brand)]">
            <ChevronRight size={16} />
          </motion.div>
          {t('projects')} ({projects.length})
        </span>
      </button>

      <AnimatePresence>
        {isProjectsExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-xl mt-3 overflow-hidden">
              {projects.length === 0 ? (
                <div className="p-4 text-center text-xs text-[var(--text-muted)]">{t('noProjectsLinked')}</div>
              ) : (
                <div className="divide-y divide-[var(--border-default)]">
                  {projects.map((project: any) => {
                    const statusKey = getStatusTranslationKey(project.status);
                    const statusLabel = t(statusKey as any);
                    const statusColor = STATUS_COLORS[project.status] || STATUS_COLORS['draft'];
                    
                    const pTotalTasks = project.steps?.length || 0;
                    const pCompletedTasks = project.steps?.filter((s:any) => s.isCompleted).length || 0;
                    const pRatio = pTotalTasks > 0 ? Math.round((pCompletedTasks / pTotalTasks) * 100) : 0;

                    return (
                      <div key={project._id} className="p-3 hover:bg-[var(--bg-overlay)] transition-colors cursor-pointer" onClick={() => onProjectClick(project._id)}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Folder size={12} className="text-[var(--text-muted)]" />
                            <span className="text-xs font-bold text-white truncate max-w-[120px]">{project.title}</span>
                          </div>
                          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-md", statusColor)}>
                            {statusLabel}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-[var(--border-default)] flex items-center justify-center text-[8px] text-white">ي</div>
                            <span className="text-[10px] text-[var(--text-muted)]">يوسف</span>
                          </div>
                          <span className="text-[10px] text-[var(--text-muted)]">{pRatio}%</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex-1 max-w-[60%] h-1 bg-[var(--border-default)] rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--color-brand)] transition-all" style={{ width: `${pRatio}%` }} />
                          </div>
                          <span className="text-[9px] text-[var(--text-muted)] font-mono">
                            {pCompletedTasks}/{pTotalTasks} {t('todo')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="p-2 border-t border-[var(--border-default)] bg-[var(--bg-base)]">
                <button onClick={(e) => { e.stopPropagation(); onAddProject(client._id); }} className="w-full py-1 text-xs text-[var(--color-brand)] hover:bg-[var(--color-brand)]/10 rounded font-bold transition-colors">
                  + {t('addProject')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col mt-auto gap-4">
        {/* Financial Status Indicator */}
        <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[var(--text-muted)] tracking-widest uppercase">{t('totalRevenue') || 'إجمالي الدخل'}</span>
            <span className="text-lg font-black text-emerald-400">{formatCurrency(financials.total)}</span>
          </div>
          <div className="h-8 w-px bg-white/10 mx-2" />
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-bold text-[var(--text-muted)] tracking-widest uppercase">{t('balance') || 'الرصيد'}</span>
            <span className={cn("text-lg font-black", (client.balanceCents || 0) >= 0 ? "text-emerald-400" : "text-orange-400")}>
              {formatCurrency(client.balanceCents || 0)}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 w-full">
          <button 
            onClick={(e) => { e.stopPropagation(); navigate(`/clients/${client._id}?tab=finance`); }}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white py-2 rounded-xl text-xs font-bold transition-all border border-emerald-500/20"
          >
            <Wallet size={14} /> {language === 'ar' ? 'إضافة دفعة' : 'Add Payment'}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onClientClick(); }}
            className="flex items-center justify-center bg-white/5 hover:bg-white/10 text-white w-10 py-2 rounded-xl transition-all border border-white/5"
          >
            <ChevronRight size={16} className="rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}
