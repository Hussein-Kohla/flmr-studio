import { PageWrapper } from '@/components/layout/PageWrapper'
import { motion } from 'framer-motion'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/hooks/useSettings'
import { formatCurrency, cn } from '@/lib/utils'
import { useMemo } from 'react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts'
import { TrendingUp, TrendingDown, Users, Briefcase, DollarSign, Target, Activity, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, Clock as ClockIcon } from 'lucide-react'

const COLORS = {
  brand: '#a855f7',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4d4d',
  info: '#3b82f6',
  muted: '#94a3b8'
}

export default function AnalyticsPage() {
  const { token } = useAuth()
  const { t } = useSettings()

  const clientsData = useQuery(api.clients.getClients, token ? { token, paginationOpts: { numItems: 1000, cursor: null } } : 'skip')
  const projectsData = useQuery(api.projects.getProjects, token ? { token, paginationOpts: { numItems: 1000, cursor: null } } : 'skip')
  const paymentsData = useQuery(api.payments.getPayments, token ? { token, paginationOpts: { numItems: 1000, cursor: null } } : 'skip')
  const transactionsData = useQuery(api.transactions.getTransactions, token ? { token, paginationOpts: { numItems: 1000, cursor: null } } : 'skip')

  const clients = clientsData?.page || []
  const projects = projectsData?.page || []
  const payments = paymentsData?.page || []
  const transactions = transactionsData?.page || []

  const incomeTransactions = transactions.filter(t => t.type === 'income')
  const expenseTransactions = transactions.filter(t => t.type === 'expense')

  // Summary Metrics
  const totalRevenue = incomeTransactions.reduce((acc, t) => acc + (t.amountCents || 0), 0)
  const totalExpenses = expenseTransactions.reduce((acc, t) => acc + (t.amountCents || 0), 0)
  const netProfit = totalRevenue - totalExpenses
  const totalPending = payments.filter(p => p.status !== 'paid').reduce((acc, p) => acc + (p.amountCents || 0), 0)

  // 1. Revenue Over Time (Last 6 Months) - Calculated into a NEW array to avoid mutation bugs
  const chartData = useMemo(() => {
    const last6 = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      return { 
        monthName: d.toLocaleString('default', { month: 'short' }),
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        revenue: 0,
        expenses: 0,
        profit: 0,
        pending: 0
      }
    }).reverse()

    incomeTransactions.forEach(t => {
      const d = new Date(t.date)
      const monthRecord = last6.find(m => m.monthIndex === d.getMonth() && m.year === d.getFullYear())
      if (monthRecord) {
        monthRecord.revenue += (t.amountCents || 0) / 100
        monthRecord.profit += (t.amountCents || 0) / 100
      }
    })

    expenseTransactions.forEach(t => {
      const d = new Date(t.date)
      const monthRecord = last6.find(m => m.monthIndex === d.getMonth() && m.year === d.getFullYear())
      if (monthRecord) {
        monthRecord.expenses += (t.amountCents || 0) / 100
        monthRecord.profit -= (t.amountCents || 0) / 100
      }
    })

    payments.filter(p => p.status !== 'paid').forEach(payment => {
      const d = new Date(payment.createdAt)
      const monthRecord = last6.find(m => m.monthIndex === d.getMonth() && m.year === d.getFullYear())
      if (monthRecord) {
        monthRecord.pending += (payment.amountCents || 0) / 100
      }
    })

    return last6
  }, [incomeTransactions, expenseTransactions, payments])

  // 2. Project Status Distribution
  const projectStatusCounts = projects.reduce((acc: any, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {})

  const projectStatusData = [
    { name: t('draft'), value: projectStatusCounts['draft'] || 0, color: COLORS.muted },
    { name: t('inReview'), value: projectStatusCounts['in_review'] || 0, color: COLORS.info },
    { name: t('revision'), value: projectStatusCounts['revision'] || 0, color: COLORS.warning },
    { name: t('approved'), value: projectStatusCounts['approved'] || 0, color: COLORS.brand },
    { name: t('completed'), value: projectStatusCounts['done'] || 0, color: COLORS.success },
  ].filter(d => d.value > 0)

  // 3. Top Clients Table
  const topClients = useMemo(() => {
    const clientProjectCounts: Record<string, number> = {}
    projects.forEach(p => {
      const cid = p.clientId.toString()
      clientProjectCounts[cid] = (clientProjectCounts[cid] || 0) + 1
    })

    return clients.map(c => {
      const clientIdStr = c._id.toString()
      const clientPayments = payments.filter(p => p.clientId.toString() === clientIdStr)
      const clientPaymentIds = clientPayments.map(p => p._id.toString())
      
      return {
        name: c.name,
        avatarUrl: c.avatarUrl,
        projects: clientProjectCounts[clientIdStr] || 0,
        revenue: incomeTransactions
          .filter(t => t.referenceId && clientPaymentIds.includes(t.referenceId))
          .reduce((a, b) => a + (b.amountCents || 0), 0),
        pending: clientPayments.filter(p => p.status !== 'paid').reduce((a, b) => a + (b.amountCents || 0), 0)
      }
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
  }, [clients, projects, payments, incomeTransactions])

  // 4. Monthly Revenue Trend
  const monthlyRevenue = useMemo(() => {
    const months = [t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun'), t('jul'), t('aug'), t('sep'), t('oct'), t('nov'), t('dec')]
    const currentYear = new Date().getFullYear()
    
    return Array.from({ length: 12 }).map((_, i) => {
      const monthIncome = incomeTransactions
        .filter(t => {
          const pd = new Date(t.date)
          return pd.getMonth() === i && pd.getFullYear() === currentYear
        })
        .reduce((a, b) => a + ((b.amountCents || 0) / 100), 0)
      return { name: months[i], revenue: monthIncome }
    })
  }, [incomeTransactions])

  // Custom Tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
          <p className="text-[var(--text-secondary)] font-bold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-bold flex items-center gap-2" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}: {typeof entry.value === 'number' ? formatCurrency(entry.value * 100) : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <PageWrapper
      title={t("advancedAnalytics")}
      subtitle={t("analyticsSubtitle")}
      actions={
        <div className="flex gap-2">
          <Badge variant="info" className="text-xs font-bold">
            <Activity size={14} className="mr-1" /> Live Data
          </Badge>
        </div>
      }
    >
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { label: t('totalRevenue'), value: totalRevenue, color: COLORS.success, icon: TrendingUp, change: '+12%' },
          { label: t('totalExpenses'), value: totalExpenses, color: COLORS.danger, icon: TrendingDown, change: '-5%' },
          { label: t('netProfit'), value: netProfit, color: COLORS.brand, icon: DollarSign, change: '+8%' },
          { label: t('pendingInvoices'), value: totalPending, color: COLORS.warning, icon: ClockIcon, change: '3 pending' }
        ].map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-3xl p-6",
              "hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl" style={{ backgroundColor: `${metric.color}15` }}>
                <metric.icon size={22} style={{ color: metric.color }} />
              </div>
              <span className={cn(
                "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                metric.change.startsWith('+') ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
              )}>
                {metric.change.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {metric.change}
              </span>
            </div>
            <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mb-1">{metric.label}</p>
            <h2 className="text-2xl lg:text-3xl font-black text-[var(--text-primary)]">
              {formatCurrency(metric.value as number)}
            </h2>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
      >
        {/* Main Revenue Chart */}
        <Card className="lg:col-span-2 overflow-hidden flex flex-col border-[var(--border-subtle)]">
          <CardHeader className="border-b border-[var(--border-subtle)] bg-black/20">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Activity size={16} className="text-brand" /> Revenue & Profit Trend (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardBody className="p-6 flex-1 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.brand} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={COLORS.brand} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="monthName" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={COLORS.success} strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="profit" name="Profit" stroke={COLORS.brand} strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Project Status Donut Chart */}
        <Card className="flex flex-col border-[var(--border-subtle)]">
          <CardHeader className="border-b border-[var(--border-subtle)] bg-black/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieChartIcon size={16} className="text-brand" /> Project Pipeline
            </CardTitle>
          </CardHeader>
          <CardBody className="p-6 flex-1 min-h-[350px] flex flex-col justify-center">
            {projectStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">{t("noProjectData")}</div>
            )}
          </CardBody>
        </Card>
      </motion.div>

      {/* Charts Row 2 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
      >
        {/* Monthly Revenue Bar Chart */}
        <Card className="border-[var(--border-subtle)]">
          <CardHeader className="border-b border-[var(--border-subtle)] bg-black/20">
            <CardTitle className="text-sm font-bold">{t("monthlyRevenueYear")}</CardTitle>
          </CardHeader>
          <CardBody className="p-6 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill={COLORS.brand} radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Quick Stats */}
        <Card className="border-[var(--border-subtle)]">
          <CardHeader className="border-b border-[var(--border-subtle)] bg-black/20">
            <CardTitle className="text-sm font-bold">{t("performanceMetrics")}</CardTitle>
          </CardHeader>
          <CardBody className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[var(--bg-surface)] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Users size={18} className="text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{t("totalClients")}</span>
                </div>
                <span className="text-xl font-black text-[var(--text-primary)]">{clients.length}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-[var(--bg-surface)] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Briefcase size={18} className="text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{t("projects") || "Total Projects"}</span>
                </div>
                <span className="text-xl font-black text-[var(--text-primary)]">{projects.length}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-[var(--bg-surface)] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Target size={18} className="text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{t("completedProjects")}</span>
                </div>
                <span className="text-xl font-black text-emerald-400">{projectStatusCounts['done'] || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-[var(--bg-surface)] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <DollarSign size={18} className="text-amber-400" />
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{t("avgRevenueClient")}</span>
                </div>
                <span className="text-xl font-black text-brand">
                  {clients.length > 0 ? formatCurrency(totalRevenue / clients.length) : '0'}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Top Clients Table */}
      <Card className="overflow-hidden border-[var(--border-subtle)]">
        <CardHeader className="border-b border-[var(--border-subtle)] bg-black/20">
          <CardTitle className="text-sm font-bold">{t("topClientsRevenue")}</CardTitle>
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] text-xs uppercase tracking-wider font-bold">
                <th className="p-4 pl-6">{t("clientName")}</th>
                <th className="p-4">{t("projects") || "Total Projects"}</th>
                <th className="p-4">{t("revenue")}</th>
                <th className="p-4">{t("pendingCollection")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {topClients.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-[var(--text-muted)] font-bold uppercase tracking-widest text-xs">{t("noClientDataFound")}</td></tr>
              ) : topClients.map((client, i) => (
                <motion.tr 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  className="hover:bg-white/[0.03] transition-all duration-300 group"
                >
                  <td className="p-4 pl-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand to-indigo-500 flex items-center justify-center font-black text-white text-sm shadow-lg group-hover:scale-110 transition-transform">
                      {client.avatarUrl ? <img src={client.avatarUrl} alt="" className="w-full h-full object-cover rounded-xl" /> : client.name.charAt(0)}
                    </div>
                    <span className="font-black text-[var(--text-primary)] group-hover:text-brand transition-colors">{client.name}</span>
                  </td>
                  <td className="p-4">
                    <Badge variant="muted" className="bg-white/5 border-none font-bold">{client.projects} Projects</Badge>
                  </td>
                  <td className="p-4 font-black text-emerald-400">{formatCurrency(client.revenue)}</td>
                  <td className="p-4 font-black text-amber-400">{formatCurrency(client.pending)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </PageWrapper>
  )
}
