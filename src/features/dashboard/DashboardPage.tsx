import { useState, useMemo } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn, formatCurrency } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts'
import {
  Users, Briefcase, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight,
  Plus, Calendar as CalendarIcon, ExternalLink, Activity, DollarSign, Clock,
  Target, Zap, ChevronRight, TrendingDown
} from 'lucide-react'

function StatCard({ label, value, change, positive, icon: Icon, colorClass, onClick, delay = 0 }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden group cursor-pointer transition-all duration-500",
        "bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-raised)]",
        "border border-[var(--border-subtle)] rounded-3xl p-6",
        "hover:border-[var(--color-brand)]/30 hover:shadow-xl hover:shadow-brand/5",
        "hover:-translate-y-1 active:scale-[0.98]"
      )}
    >
      {/* Background Glow */}
      <div className={cn("absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 -mr-12 -mt-12 rounded-full", colorClass)} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={cn("p-3 rounded-2xl bg-black/20 backdrop-blur-sm", colorClass)}>
          <Icon size={22} className="text-white" />
        </div>
        <div className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold",
          positive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
        )}>
          {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mb-2">{label}</p>
        <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">{value}</h3>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </motion.div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [timeRange, setTimeRange] = useState<'week' | 'month' | '6months' | 'year'>('6months')

  // Data Queries
  const clients = useQuery(api.clients.getClients, token ? { token, paginationOpts: { numItems: 100, cursor: null } } : 'skip')?.page || []
  const projects = useQuery(api.projects.getProjects, token ? { token, paginationOpts: { numItems: 100, cursor: null } } : 'skip')?.page || []
  const payments = useQuery(api.payments.getPayments, token ? { token, paginationOpts: { numItems: 100, cursor: null } } : 'skip')?.page || []
  const transactions = useQuery(api.transactions.getTransactions, token ? { token, paginationOpts: { numItems: 100, cursor: null } } : 'skip')?.page || []

  const stages = useQuery(api.stages.getStages, token ? { token } : 'skip') || []

  // Date Calculations
  const now = new Date()
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime()

  // 1. Revenue Calculations (Cents-aware)
  const incomeTransactions = transactions.filter(t => t.type === 'income')
  const totalRevenueCents = incomeTransactions.reduce((a, b) => a + (b.amountCents || 0), 0)

  const revenueThisMonthCents = incomeTransactions
    .filter(t => t.date >= startOfThisMonth)
    .reduce((a, b) => a + (b.amountCents || 0), 0)

  const revenueLastMonthCents = incomeTransactions
    .filter(t => t.date >= startOfLastMonth && t.date < startOfThisMonth)
    .reduce((a, b) => a + (b.amountCents || 0), 0)

  const revChange = revenueLastMonthCents === 0
    ? (revenueThisMonthCents > 0 ? 100 : 0)
    : Math.round(((revenueThisMonthCents - revenueLastMonthCents) / revenueLastMonthCents) * 100)

  // 2. Expense Calculations
  const expenseTransactions = transactions.filter(t => t.type === 'expense')
  const totalExpensesCents = expenseTransactions.reduce((a, b) => a + (b.amountCents || 0), 0)

  const expensesThisMonthCents = expenseTransactions
    .filter(t => t.date >= startOfThisMonth)
    .reduce((a, b) => a + (b.amountCents || 0), 0)

  const expensesLastMonthCents = expenseTransactions
    .filter(t => t.date >= startOfLastMonth && t.date < startOfThisMonth)
    .reduce((a, b) => a + (b.amountCents || 0), 0)

  const expenseChange = expensesLastMonthCents === 0
    ? (expensesThisMonthCents > 0 ? 100 : 0)
    : Math.round(((expensesThisMonthCents - expensesLastMonthCents) / expensesLastMonthCents) * 100)

  // 3. Net Profit
  const netProfitCents = totalRevenueCents - totalExpensesCents
  const netProfitThisMonth = revenueThisMonthCents - expensesThisMonthCents
  const profitChange = netProfitThisMonth >= 0 ? Math.round((netProfitThisMonth / (revenueThisMonthCents || 1)) * 100) : 0

  // 4. Project Calculations
  const activeProjects = projects.filter(p => p.status !== 'done').length
  const completedProjects = projects.filter(p => p.status === 'done').length
  const newProjectsThisMonth = projects.filter(p => p.createdAt >= startOfThisMonth).length

  // 5. Pending Calculations
  const pendingRevenueCents = payments.filter(p => p.status !== 'paid').reduce((a, b) => a + (b.amountCents || 0), 0)
  const pendingThisMonthCents = payments
    .filter(p => p.status !== 'paid' && p.createdAt >= startOfThisMonth)
    .reduce((a, b) => a + (b.amountCents || 0), 0)

  // 6. Client Calculations
  const totalClients = clients.length
  const newClientsThisMonth = clients.filter(c => c.createdAt >= startOfThisMonth).length

  // Chart Data - Revenue Over Time
  const chartData = useMemo(() => {
    const data = []
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    if (timeRange === 'year' || timeRange === '6months') {
      const monthsCount = timeRange === 'year' ? 12 : 6
      for (let i = monthsCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthIncome = incomeTransactions
          .filter(t => {
            const pd = new Date(t.date)
            return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear()
          })
          .reduce((a, b) => a + ((b.amountCents || 0) / 100), 0)
        const monthExpense = expenseTransactions
          .filter(t => {
            const pd = new Date(t.date)
            return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear()
          })
          .reduce((a, b) => a + ((b.amountCents || 0) / 100), 0)
        data.push({
          name: months[d.getMonth()],
          revenue: monthIncome,
          expenses: monthExpense,
          profit: monthIncome - monthExpense
        })
      }
    } else if (timeRange === 'month') {
      for (let i = 3; i >= 0; i--) {
        const start = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
        const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
        const weekIncome = incomeTransactions
          .filter(t => t.date >= start.getTime() && t.date < end.getTime())
          .reduce((a, b) => a + ((b.amountCents || 0) / 100), 0)
        const weekExpense = expenseTransactions
          .filter(t => t.date >= start.getTime() && t.date < end.getTime())
          .reduce((a, b) => a + ((b.amountCents || 0) / 100), 0)
        data.push({ name: `W${4 - i}`, revenue: weekIncome, expenses: weekExpense, profit: weekIncome - weekExpense })
      }
    } else if (timeRange === 'week') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
        const dayIncome = incomeTransactions
          .filter(t => {
            const pd = new Date(t.date)
            return pd.getDate() === d.getDate() && pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear()
          })
          .reduce((a, b) => a + ((b.amountCents || 0) / 100), 0)
        const dayExpense = expenseTransactions
          .filter(t => {
            const pd = new Date(t.date)
            return pd.getDate() === d.getDate() && pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear()
          })
          .reduce((a, b) => a + ((b.amountCents || 0) / 100), 0)
        data.push({ name: days[d.getDay()], revenue: dayIncome, expenses: dayExpense, profit: dayIncome - dayExpense })
      }
    }
    return data
  }, [incomeTransactions, expenseTransactions, timeRange, now])

  // Project Distribution
  const projectDist = useMemo(() => {
    const dynamicStatuses = stages.map(s => ({
      id: s.slug,
      label: s.name,
      color: s.slug === 'done' ? '#10b981' :
        s.slug === 'approved' ? '#a855f7' :
          s.slug === 'in_review' ? '#3b82f6' :
            s.slug === 'revision' ? '#f59e0b' : '#94a3b8'
    }));

    const statuses = dynamicStatuses.length > 0 ? dynamicStatuses : [
      { id: 'approved', label: 'Approved', color: '#10b981' },
      { id: 'in_review', label: 'In Review', color: '#3b82f6' },
      { id: 'draft', label: 'Draft', color: '#94a3b8' },
      { id: 'revision', label: 'Revision', color: '#f59e0b' },
    ];

    return statuses.map(s => ({
      name: s.label,
      value: projects.filter(p => p.status === s.id).length,
      color: s.color
    }))
  }, [projects, stages])

  // Recent Transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => (b.date || 0) - (a.date || 0))
    .slice(0, 5)

  // Top Clients
  const topClients = [...clients]
    .sort((a, b) => (b.balanceCents || 0) - (a.balanceCents || 0))
    .slice(0, 5)

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
          <p className="text-[var(--text-secondary)] font-bold mb-2 text-sm">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-bold flex items-center gap-2" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}: {formatCurrency(entry.value * 100)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <PageWrapper
      title="Dashboard"
      subtitle="Comprehensive overview of your studio's operations and finances."
      actions={
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/analytics')}>
            <Activity size={16} className="mr-2" /> Detailed Stats
          </Button>
          <Button size="sm" onClick={() => navigate('/projects')}>
            <Plus size={16} className="mr-2" /> New Project
          </Button>
        </div>
      }
    >
      {/* Stats Grid - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(totalRevenueCents)}
          change={`${Math.abs(revChange)}%`}
          positive={revChange >= 0}
          icon={TrendingUp}
          colorClass="bg-gradient-to-br from-emerald-500 to-emerald-600"
          onClick={() => navigate('/payments')}
          delay={0}
        />
        <StatCard
          label="Total Expenses"
          value={formatCurrency(totalExpensesCents)}
          change={`${Math.abs(expenseChange)}%`}
          positive={expenseChange <= 0}
          icon={CreditCard}
          colorClass="bg-gradient-to-br from-rose-500 to-rose-600"
          onClick={() => navigate('/payments')}
          delay={0.1}
        />
        <StatCard
          label="Net Profit"
          value={formatCurrency(netProfitCents)}
          change={`${Math.abs(profitChange)}%`}
          positive={netProfitThisMonth >= 0}
          icon={DollarSign}
          colorClass="bg-gradient-to-br from-purple-500 to-purple-600"
          onClick={() => navigate('/payments')}
          delay={0.2}
        />
        <StatCard
          label="Active Projects"
          value={activeProjects}
          change={`${newProjectsThisMonth} new`}
          positive={newProjectsThisMonth > 0}
          icon={Briefcase}
          colorClass="bg-gradient-to-br from-blue-500 to-blue-600"
          onClick={() => navigate('/projects')}
          delay={0.3}
        />
      </div>

      {/* Stats Grid - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-3xl p-6"
          onClick={() => navigate('/clients')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mb-1">Total Clients</p>
              <h3 className="text-3xl font-black text-[var(--text-primary)]">{totalClients}</h3>
              <p className="text-xs text-emerald-400 font-bold mt-1">{newClientsThisMonth} new this month</p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/20">
              <Users size={24} className="text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-3xl p-6"
          onClick={() => navigate('/tasks')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mb-1">Completed Projects</p>
              <h3 className="text-3xl font-black text-[var(--text-primary)]">{completedProjects}</h3>
              <p className="text-xs text-purple-400 font-bold mt-1">of {projects.length} total</p>
            </div>
            <div className="p-3 rounded-2xl bg-purple-500/20">
              <Target size={24} className="text-purple-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-3xl p-6"
          onClick={() => navigate('/payments')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mb-1">Pending Collection</p>
              <h3 className="text-3xl font-black text-[var(--text-primary)]">{formatCurrency(pendingRevenueCents)}</h3>
              <p className="text-xs text-amber-400 font-bold mt-1">{pendingThisMonthCents > 0 ? 'due this month' : 'all collected'}</p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/20">
              <Clock size={24} className="text-amber-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden border-[var(--border-subtle)]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[var(--border-subtle)] bg-black/20">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Zap size={16} className="text-brand" /> Revenue & Expenses Trend
            </CardTitle>
            <div className="flex bg-[var(--bg-muted)]/20 p-1 rounded-xl border border-[var(--border-subtle)]">
              {(['week', 'month', '6months', 'year'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    timeRange === r
                      ? "bg-brand text-white shadow-md"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {r === '6months' ? '6M' : r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardBody className="p-6 flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4d4d" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4d4d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} axisLine={false} tickLine={false} tickFormatter={val => `${val / 1000}k`} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4d4d" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Project Distribution */}
        <Card className="flex flex-col border-[var(--border-subtle)]">
          <CardHeader className="border-b border-[var(--border-subtle)] bg-black/20">
            <CardTitle className="text-sm font-bold">Project Pipeline</CardTitle>
          </CardHeader>
          <CardBody className="p-6 flex-1 flex flex-col items-center justify-center min-h-[300px]">
            <div className="relative w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {projectDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-[var(--text-primary)]">{projects.length}</span>
                <span className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">Projects</span>
              </div>
            </div>
            <div className="w-full mt-4 space-y-2">
              {projectDist.filter(d => d.value > 0).map(item => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[var(--text-muted)]">{item.name}</span>
                  </div>
                  <span className="font-bold text-[var(--text-primary)]">{item.value}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Bottom Row - Recent Activity & Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="overflow-hidden border-[var(--border-subtle)]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[var(--border-subtle)] bg-black/20">
            <CardTitle className="text-sm font-bold">Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/payments')}>
              View All <ChevronRight size={14} className="ml-1" />
            </Button>
          </CardHeader>
          <CardBody className="p-0">
            {recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-muted)]">No transactions yet</div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {recentTransactions.map((trx, i) => (
                  <motion.div
                    key={trx._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        trx.type === 'income' ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                      )}>
                        {trx.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[var(--text-primary)]">{trx.description}</p>
                        <p className="text-xs text-[var(--text-muted)]">{trx.category || 'General'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("font-bold text-sm", trx.type === 'income' ? "text-emerald-400" : "text-rose-400")}>
                        {trx.type === 'income' ? '+' : '-'}{formatCurrency(trx.amountCents || 0)}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">{formatCurrency(trx.amountCents || 0)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Top Clients */}
        <Card className="overflow-hidden border-[var(--border-subtle)]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[var(--border-subtle)] bg-black/20">
            <CardTitle className="text-sm font-bold">Top Clients</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/clients')}>
              View All <ChevronRight size={14} className="ml-1" />
            </Button>
          </CardHeader>
          <CardBody className="p-0">
            {topClients.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-muted)]">No clients yet</div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {topClients.map((client, i) => (
                  <motion.div
                    key={client._id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => navigate('/clients')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-indigo-500 flex items-center justify-center font-black text-white text-sm">
                        {client.name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[var(--text-primary)]">{client.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{client.company || 'Personal'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("font-bold text-sm", (client.balanceCents || 0) >= 0 ? "text-emerald-400" : "text-rose-400")}>
                        {formatCurrency(client.balanceCents || 0)}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">Balance</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </PageWrapper>
  )
}
