import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '@/hooks/useSettings'
import { ArrowLeft, Users, TrendingUp, DollarSign, Briefcase } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/lib/utils'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  Legend
} from 'recharts'


export default function ClientAnalyticsPage() {
  const { t } = useSettings();
  const { token } = useAuth()
  const navigate = useNavigate()

  const clientsData = useQuery(api.clients.getClients, token ? { token, paginationOpts: { numItems: 1000, cursor: null } } : 'skip')
  const projectsData = useQuery(api.projects.getProjects, token ? { token, paginationOpts: { numItems: 1000, cursor: null } } : 'skip')
  const paymentsData = useQuery(api.payments.getPayments, token ? { token, paginationOpts: { numItems: 1000, cursor: null } } : 'skip')

  const clients = clientsData?.page || []
  const projects = projectsData?.page || []
  const payments = paymentsData?.page || []

  // 1. Client Growth (Mock or based on createdAt if available)
  const clientRevenueData = clients.map(c => {
    const revenue = payments.filter(p => p.clientId === c._id && p.status === 'paid').reduce((sum, p) => sum + (p.amountCents || 0), 0)
    const pending = payments.filter(p => p.clientId === c._id && p.status !== 'paid').reduce((sum, p) => sum + (p.amountCents || 0), 0)
    return { name: c.name, revenue, pending }
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 10)

  // Group clients by average monthly income
  const clientAverageData = clients.map(c => {
    const paidTxs = payments.filter(p => p.clientId === c._id && p.status === 'paid');
    const totalPaid = paidTxs.reduce((a, b) => a + (b.amountCents || 0), 0);
    const numMonths = Math.max(1, paidTxs.length);
    const average = totalPaid / numMonths;

    return {
      name: c.name,
      average: average,
      projects: projects.filter(p => p.clientId === c._id).length
    };
  }).sort((a, b) => b.average - a.average).slice(0, 10);

  // 2. Average Project Value
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((a, b) => a + (b.amountCents || 0), 0)
  const avgProjectValue = projects.length > 0 ? totalPaid / projects.length : 0

  // 3. Project Status by Client (Top 5)
  const topClientsByProject = clients.map(c => ({
    name: c.name,
    total: projects.filter(p => p.clientId === c._id).length,
    completed: projects.filter(p => p.clientId === c._id && p.status === 'done').length
  })).sort((a, b) => b.total - a.total).slice(0, 5)

  return (
    <PageWrapper
      title="Client Analytics"
      subtitle="Deep dive into client value, project volume, and payment behavior."
      actions={
        <Button variant="ghost" size="sm" onClick={() => navigate('/clients')} leftIcon={<ArrowLeft size={16} />}>
          Back to Clients
        </Button>
      }
    >
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card glass className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand/10 text-brand rounded-2xl"><Users size={24} /></div>
            <div>
              <p className="text-[var(--text-muted)] text-xs font-bold uppercase">{t("totalClients")}</p>
              <h3 className="text-2xl font-bold">{clients.length}</h3>
            </div>
          </div>
        </Card>
        <Card glass className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl"><Briefcase size={24} /></div>
            <div>
              <p className="text-[var(--text-muted)] text-xs font-bold uppercase">{t("totalProjectsCount")}</p>
              <h3 className="text-2xl font-bold">{projects.length}</h3>
            </div>
          </div>
        </Card>
        <Card glass className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 text-green-500 rounded-2xl"><DollarSign size={24} /></div>
            <div>
              <p className="text-[var(--text-muted)] text-xs font-bold uppercase">{t("avgProjValue")}</p>
              <h3 className="text-2xl font-bold">{formatCurrency(avgProjectValue)}</h3>
            </div>
          </div>
        </Card>
        <Card glass className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl"><TrendingUp size={24} /></div>
            <div>
              <p className="text-[var(--text-muted)] text-xs font-bold uppercase">{t("activeRate")}</p>
              <h3 className="text-2xl font-bold">{clients.length > 0 ? Math.round((projects.length / clients.length) * 10) / 10 : 0} <span className="text-sm font-normal text-[var(--text-muted)]">{t("projPerClient")}</span></h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue by Client */}
        <Card className="flex flex-col">
          <CardHeader className="border-b border-[var(--border-subtle)] bg-black/5">
            <CardTitle>{t("top10ClientsRevenue")}</CardTitle>
          </CardHeader>
          <CardBody className="p-6 flex-1 min-h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientRevenueData} layout="vertical" margin={{ left: 40, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-subtle)" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} width={100} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  cursor={{ fill: 'var(--bg-hover)', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderRadius: '12px' }}
                />
                <Bar dataKey="revenue" name="Paid Revenue" fill="var(--color-brand)" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="pending" name="Pending" fill="var(--color-warning)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Projects per Client */}
        <Card className="flex flex-col">
          <CardHeader className="border-b border-[var(--border-subtle)] bg-black/5">
            <CardTitle>{t("projVolumeVsCompletion")}</CardTitle>
          </CardHeader>
          <CardBody className="p-6 flex-1 min-h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topClientsByProject} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderRadius: '12px' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="total" name="Total Projects" fill="var(--color-info)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Average by Client */}
        <Card className="border border-[var(--border-subtle)]">
          <CardHeader>
            <CardTitle>{t("top10ClientsAvgIncome")}</CardTitle>
          </CardHeader>
          <CardBody className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientAverageData} layout="vertical" margin={{ left: 40, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-subtle)" />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickFormatter={v => `${v/1000}k`} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} width={100} />
                <RechartsTooltip 
                  cursor={{fill: 'var(--bg-muted)', opacity: 0.2}}
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}
                />
                <Bar dataKey="average" name="Average Monthly" fill="var(--color-brand)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <Card className="border border-[var(--border-subtle)]">
        <CardHeader>
          <CardTitle>{t("topClientsList")}</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] text-[10px] uppercase tracking-wider font-bold">
                <th className="p-4 pl-6">{t("clientNameHeader")}</th>
                <th className="p-4">{t("projectsHeader")}</th>
                <th className="p-4">{t("avgMonthlyIncomeHeader")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {clientAverageData.map((client, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 pl-6 font-bold text-[var(--text-primary)]">{client.name}</td>
                  <td className="p-4 text-[var(--text-secondary)]">{client.projects}</td>
                  <td className="p-4 font-bold text-[var(--color-success)]">{formatCurrency(client.average)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </PageWrapper>
  )
}
