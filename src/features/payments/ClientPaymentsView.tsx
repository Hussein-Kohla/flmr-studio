import React, { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, cn } from '@/lib/utils';
import { Users, Calendar, DollarSign, Wallet, Target, Search, BarChart3, TrendingUp, Scissors, Megaphone, PenTool, Briefcase, Filter } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export default function ClientPaymentsView({ filter = 'all' }: { filter?: 'all' | 'ads' }) {
  const { token } = useAuth();
  
  const clientsQuery = useQuery(api.clients.getClients, token ? {
    token,
    paginationOpts: { numItems: 1000, cursor: null }
  } : 'skip');
  
  const projectsQuery = useQuery(api.projects.getProjects, token ? {
    token,
    paginationOpts: { numItems: 1000, cursor: null }
  } : 'skip');

  const transactionsQuery = useQuery(api.transactions.getTransactions, token ? {
    token,
    paginationOpts: { numItems: 1000, cursor: null }
  } : 'skip');

  const clients = useMemo(() => clientsQuery?.page || [], [clientsQuery?.page]);
  const projects = useMemo(() => projectsQuery?.page || [], [projectsQuery?.page]);
  const transactions = useMemo(() => transactionsQuery?.page || [], [transactionsQuery?.page]);

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [periodType, setPeriodType] = useState<'all' | 'monthly' | 'yearly'>('all');

  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    return clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [clients, searchQuery]);

  React.useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0]._id);
    }
  }, [clients, selectedClientId]);

  const selectedClient = clients.find(c => c._id === selectedClientId);

  // Financial calculations for ADS view
  const { overall, monthly } = useMemo(() => {
    if (!selectedClientId || filter !== 'ads') return { overall: { budget: 0, paid: 0, remaining: 0 }, monthly: { budget: 0, paid: 0, remaining: 0 } };

    let oBudget = 0, oPaid = 0;
    let mBudget = 0, mPaid = 0;

    const clientProjects = projects.filter(p => {
      if (p.clientId !== selectedClientId) return false;
      const pt = (p.projectType || '').toLowerCase();
      return pt.includes('ممول') || pt.includes('إعلان') || pt.includes('اعلان');
    });

    clientProjects.forEach(p => {
      const b = p.budgetCents || 0;
      const r = p.revenueCents || 0;
      oBudget += b;
      oPaid += r;
      const date = p.startDate || p.deadline || p.createdAt;
      if (date) {
        const pDate = new Date(date);
        if (pDate.getMonth() === selectedMonth && pDate.getFullYear() === selectedYear) {
          mBudget += b;
          mPaid += r;
        }
      }
    });

    return {
      overall: { budget: oBudget, paid: oPaid, remaining: oBudget - oPaid },
      monthly: { budget: mBudget, paid: mPaid, remaining: mBudget - mPaid }
    };
  }, [projects, selectedClientId, selectedMonth, selectedYear, filter]);

  // Financial calculations for ALL view (using transactions)
  const allMoneyStats = useMemo(() => {
    if (!selectedClientId || filter !== 'all') return null;

    let stats = {
      videoEditing: 0,
      funding: 0,
      advertising: 0,
      design: 0,
      management: 0,
      other: 0,
      totalIncome: 0,
    };

    const clientTx = transactions.filter(t => {
      if (t.clientId !== selectedClientId) return false;
      if (t.status !== 'paid' && t.status !== 'posted') return false;
      if (t.type !== 'income') return false;

      const date = new Date(t.date || t.createdAt);
      if (periodType === 'monthly') {
        if (date.getMonth() !== selectedMonth || date.getFullYear() !== selectedYear) return false;
      } else if (periodType === 'yearly') {
        if (date.getFullYear() !== selectedYear) return false;
      }

      return true;
    });

    clientTx.forEach(t => {
      const amount = t.amountCents || 0;
      const cat = t.category || '';
      
      stats.totalIncome += amount;

      if (cat.includes('مونتاج')) stats.videoEditing += amount;
      else if (cat.includes('تمويل')) stats.funding += amount;
      else if (cat.includes('دعاية')) stats.advertising += amount;
      else if (cat.includes('تصميم')) stats.design += amount;
      else if (cat.includes('إدارة')) stats.management += amount;
      else stats.other += amount;
    });

    return {
      ...stats,
      netProfit: stats.totalIncome - stats.funding
    };
  }, [transactions, selectedClientId, periodType, selectedMonth, selectedYear, filter]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentYear);
    years.add(currentYear - 1);
    if (filter === 'ads') {
      projects.forEach(p => {
        const date = p.startDate || p.deadline || p.createdAt;
        if (date) years.add(new Date(date).getFullYear());
      });
    } else {
      transactions.forEach(t => {
        const date = t.date || t.createdAt;
        if (date) years.add(new Date(date).getFullYear());
      });
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [projects, transactions, currentYear, filter]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 rtl:flex-row-reverse" dir="rtl">
      
      {/* Right Side: Clients List */}
      <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col gap-4">
        <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col h-[calc(100vh-250px)]">
          <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <Users className="text-brand" /> العملاء
          </h3>
          
          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
            <input 
              type="text" 
              placeholder="ابحث عن عميل..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-10 pl-4 text-sm font-bold text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-brand transition-colors"
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pl-2">
            {filteredClients.map((client) => (
              <button
                key={client._id}
                onClick={() => setSelectedClientId(client._id)}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 text-right w-full",
                  selectedClientId === client._id
                    ? "bg-gradient-to-r from-brand/80 to-indigo-600/80 border border-brand/50 shadow-lg shadow-brand/20 text-white"
                    : "bg-white/5 border border-white/5 hover:bg-white/10 text-[var(--text-primary)]"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-black text-lg",
                  selectedClientId === client._id ? "bg-white/20" : "bg-[var(--bg-surface)] text-brand"
                )}>
                  {client.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold">{client.name}</div>
                  <div className="text-xs opacity-70 font-semibold">{client.company || 'بدون شركة'}</div>
                </div>
              </button>
            ))}
            {filteredClients.length === 0 && (
              <div className="text-center p-8 text-[var(--text-muted)] font-bold text-sm">
                لا يوجد عملاء
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Left/Center Side: Financial Details */}
      <div className="flex-1 flex flex-col gap-6">
        <AnimatePresence mode="wait">
          {selectedClient ? (
            <motion.div 
              key={`${selectedClient._id}-${filter}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col gap-6"
            >
              {/* Header Info */}
              <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white mb-1">تفاصيل الميزانية لـ {selectedClient.name}</h2>
                  <p className="text-[var(--text-muted)] font-bold text-sm">استعرض المبالغ المرتبطة بهذا العميل</p>
                </div>
                
                {/* Global Filters for "All Money" view */}
                {filter === 'all' && (
                  <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10">
                    <Filter size={18} className="text-white/50" />
                    <CustomSelect
                      value={periodType}
                      onChange={(val) => setPeriodType(val as any)}
                      className="w-32"
                      dropdownClassName="min-w-[150px]"
                      options={[
                        { label: 'كل الأوقات', value: 'all' },
                        { label: 'حسب السنة', value: 'yearly' },
                        { label: 'حسب الشهر', value: 'monthly' }
                      ]}
                    />
                    
                    {periodType !== 'all' && (
                      <CustomSelect
                        value={selectedYear}
                        onChange={(val) => setSelectedYear(Number(val))}
                        className="w-24"
                        options={availableYears.map(y => ({ label: String(y), value: y }))}
                      />
                    )}

                    {periodType === 'monthly' && (
                      <CustomSelect
                        value={selectedMonth}
                        onChange={(val) => setSelectedMonth(Number(val))}
                        className="w-32"
                        options={ARABIC_MONTHS.map((m, i) => ({ label: m, value: i }))}
                      />
                    )}
                  </div>
                )}
              </div>

              {filter === 'all' && allMoneyStats ? (
                // --- ALL MONEY VIEW ---
                <div className="space-y-6">
                  {/* Top Stats: Total & Net Profit */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/30 rounded-full blur-3xl" />
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <div className="text-indigo-300 font-black uppercase tracking-widest text-sm mb-2">الإجمالي العام</div>
                          <div className="text-4xl font-black text-white">{formatCurrency(allMoneyStats.totalIncome)}</div>
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                          <BarChart3 size={32} />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/30 rounded-full blur-3xl" />
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <div className="text-emerald-300 font-black uppercase tracking-widest text-sm mb-2">صافي الربح</div>
                          <div className="text-4xl font-black text-white">{formatCurrency(allMoneyStats.netProfit)}</div>
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <TrendingUp size={32} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Categories Breakdown */}
                  <h3 className="text-xl font-black text-white flex items-center gap-2 mt-4">
                    <Target className="text-brand" /> تفصيل الفلوس حسب النوع
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard title="فلوس التمويل" amount={allMoneyStats.funding} icon={<Target size={20} />} color="indigo" />
                    <StatCard title="فلوس المونتاج" amount={allMoneyStats.videoEditing} icon={<Scissors size={20} />} color="brand" />
                    <StatCard title="فلوس الدعاية" amount={allMoneyStats.advertising} icon={<Megaphone size={20} />} color="orange" />
                    <StatCard title="فلوس التصميم" amount={allMoneyStats.design} icon={<PenTool size={20} />} color="rose" />
                    <StatCard title="فلوس الإدارة" amount={allMoneyStats.management} icon={<Briefcase size={20} />} color="emerald" />
                    <StatCard title="أخرى" amount={allMoneyStats.other} icon={<Wallet size={20} />} color="emerald" variant="solid" />
                  </div>
                </div>
              ) : (
                // --- SPONSORED ADS VIEW ---
                <>
                  {/* Global Stats at the top */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-black/20 border border-white/10 rounded-3xl p-6 shadow-lg text-center relative overflow-hidden">
                      <div className="text-[var(--text-muted)] font-bold mb-2">فلوس العميل المتاحة للتمويل (الرصيد)</div>
                      <div className="text-3xl font-black text-blue-400">{formatCurrency(overall.paid)}</div>
                    </div>
                    <div className="bg-black/20 border border-white/10 rounded-3xl p-6 shadow-lg text-center relative overflow-hidden">
                      <div className="text-[var(--text-muted)] font-bold mb-2">الصرف</div>
                      <div className="text-3xl font-black text-rose-500">{formatCurrency(overall.budget)}</div>
                    </div>
                    <div className="bg-black/20 border border-white/10 rounded-3xl p-6 shadow-lg text-center relative overflow-hidden">
                      <div className="text-[var(--text-muted)] font-bold mb-2">إجمالي الربح منه (صافي الربح)</div>
                      <div className="text-3xl font-black text-emerald-500">{formatCurrency(overall.paid - overall.budget)}</div>
                    </div>
                  </div>

                  {/* Monthly Stats */}
                  <div className="bg-gradient-to-br from-[var(--bg-surface)] to-black/40 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
                    
                    <div className="relative z-10">
                      <div className="flex flex-wrap items-center justify-between mb-8 gap-4 border-b border-white/10 pb-6">
                        <h3 className="text-xl font-black text-white flex items-center gap-2">
                          <Calendar className="text-indigo-400" /> إحصائيات الشهر للإعلانات
                        </h3>
                        
                        <div className="flex gap-3">
                          <CustomSelect
                            value={selectedMonth}
                            onChange={(val) => setSelectedMonth(Number(val))}
                            className="w-32"
                            options={ARABIC_MONTHS.map((m, i) => ({ label: m, value: i }))}
                          />
                          <CustomSelect
                            value={selectedYear}
                            onChange={(val) => setSelectedYear(Number(val))}
                            className="w-24"
                            options={availableYears.map(y => ({ label: String(y), value: y }))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="تمويل ب مبلغ" amount={monthly.budget} icon={<Target size={24} />} color="indigo" />
                        <StatCard title="تم الدفع" amount={monthly.paid} icon={<Wallet size={24} />} color="emerald" />
                        <StatCard title="المتبقي" amount={monthly.remaining} icon={<DollarSign size={24} />} color="orange" />
                      </div>
                    </div>
                  </div>

                  {/* Overall Stats */}
                  <div className="bg-gradient-to-br from-black/40 to-[var(--bg-surface)] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2" />
                    
                    <div className="relative z-10">
                      <h3 className="text-xl font-black text-white flex items-center gap-2 mb-8 border-b border-white/10 pb-6">
                        <Target className="text-brand" /> عموماً للإعلانات (إجمالي التعاملات)
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="إجمالي التمويل" amount={overall.budget} icon={<Target size={24} />} color="brand" variant="solid" />
                        <StatCard title="إجمالي المدفوع" amount={overall.paid} icon={<Wallet size={24} />} color="emerald" variant="solid" />
                        <StatCard title="إجمالي المتبقي" amount={overall.remaining} icon={<DollarSign size={24} />} color="rose" variant="solid" />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center p-12 bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl">
              <div className="text-center">
                <Users size={64} className="mx-auto text-[var(--text-muted)] mb-4 opacity-50" />
                <h3 className="text-xl font-black text-white mb-2">لم يتم تحديد عميل</h3>
                <p className="text-[var(--text-muted)] font-bold">الرجاء اختيار عميل من القائمة لعرض تفاصيل المبالغ الخاصة به.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatCard({ title, amount, icon, color, variant = "outline" }: { title: string, amount: number, icon: React.ReactNode, color: 'indigo' | 'emerald' | 'orange' | 'brand' | 'rose', variant?: 'outline' | 'solid' }) {
  
  const colors = {
    indigo: { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', solidBg: 'bg-gradient-to-br from-indigo-500 to-purple-600', solidBorder: 'border-indigo-400/50' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', solidBg: 'bg-gradient-to-br from-emerald-500 to-teal-600', solidBorder: 'border-emerald-400/50' },
    orange: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', solidBg: 'bg-gradient-to-br from-orange-500 to-amber-600', solidBorder: 'border-orange-400/50' },
    brand: { text: 'text-brand', bg: 'bg-brand/10', border: 'border-brand/20', solidBg: 'bg-gradient-to-br from-brand to-indigo-600', solidBorder: 'border-brand/50' },
    rose: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', solidBg: 'bg-gradient-to-br from-rose-500 to-red-600', solidBorder: 'border-rose-400/50' },
  };

  const style = colors[color];
  const isSolid = variant === 'solid';

  return (
    <div className={cn(
      "rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:scale-[1.02]",
      isSolid ? style.solidBg : "bg-black/20",
      "border",
      isSolid ? style.solidBorder : style.border
    )}>
      {!isSolid && (
        <div className={cn("absolute -top-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-50", style.bg)} />
      )}
      
      <div className="relative z-10">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg",
          isSolid ? "bg-black/20 text-white backdrop-blur-md" : cn(style.bg, style.text)
        )}>
          {icon}
        </div>
        
        <div className={cn("text-sm font-bold uppercase tracking-widest mb-2", isSolid ? "text-white/80" : "text-[var(--text-muted)]")}>
          {title}
        </div>
        
        <div className={cn("text-3xl font-black", isSolid ? "text-white" : style.text)}>
          {formatCurrency(amount)}
        </div>
      </div>
    </div>
  );
}
