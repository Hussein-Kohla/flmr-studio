import { useSettings } from '@/hooks/useSettings'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '../../hooks/useAuth'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Wallet, Plus, Minus, PieChart, CreditCard, Trash2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Calendar, Download } from 'lucide-react'
import { TransactionModal } from './TransactionModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import RecurringCollectionsView from '@/features/payments/RecurringCollectionsView'
import { Button } from '@/components/ui/Button'

export default function PaymentsPage() {
  const { token } = useAuth()
  const { t } = useSettings()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'overview' | 'monthly'>('overview')
  const [isBalanceHidden, setIsBalanceHidden] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'income' | 'expense'>('income')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')

  const transactionsData = useQuery(api.transactions.getTransactions, token ? { token, paginationOpts: { numItems: 100, cursor: null } } : 'skip')
  const clientsData = useQuery(api.clients.getClients, token ? { token, paginationOpts: { numItems: 100, cursor: null } } : 'skip')

  const transactions = transactionsData?.page || []
  const clients = clientsData?.page || []

  const deleteTransaction = useMutation(api.transactions.deleteTransaction)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Calculate Financial Stats
  const filteredTransactions = transactions.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType
    return matchesType
  })

  const incomeTransactions = filteredTransactions.filter(t => t.type === 'income')
  const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense')

  const totalIncome = incomeTransactions.reduce((acc, t) => acc + (t.amountCents || 0), 0)
  const totalExpense = expenseTransactions.reduce((acc, t) => acc + (t.amountCents || 0), 0)
  const totalBalance = totalIncome - totalExpense

  // Monthly calculations
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const startOfMonth = new Date(currentYear, currentMonth, 1).getTime()
  const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1).getTime()

  const incomeThisMonth = incomeTransactions.filter(t => t.date >= startOfMonth).reduce((a, b) => a + (b.amountCents || 0), 0)
  const incomeLastMonth = incomeTransactions.filter(t => t.date >= startOfLastMonth && t.date < startOfMonth).reduce((a, b) => a + (b.amountCents || 0), 0)
  const expenseThisMonth = expenseTransactions.filter(t => t.date >= startOfMonth).reduce((a, b) => a + (b.amountCents || 0), 0)

  // Recurring calculations from clients
  const recurringIncome = clients.reduce((acc, c) => acc + (c.subscription?.amountCents || 0), 0)

  // Changes
  const incomeChange = incomeLastMonth === 0 ? 100 : Math.round(((incomeThisMonth - incomeLastMonth) / incomeLastMonth) * 100)

  const handleDeleteTransaction = async () => {
    if (!token || !deleteConfirmId) return
    try {
      await deleteTransaction({ token, transactionId: deleteConfirmId as any })
      toast("Transaction deleted successfully.", "success")
    } catch (err) {
      toast("Failed to delete transaction.", "error")
    } finally {
      setDeleteConfirmId(null)
    }
  }

  const openModal = (type: 'income' | 'expense') => {
    setModalType(type)
    setModalOpen(true)
  }

  return (
    <PageWrapper
      title={t("financialOverview")}
      subtitle={t("financialSubtitle")}
      actions={
        <div className="flex gap-3">
          <Button variant="secondary" size="sm">
            <Download size={16} className="mr-2" /> Export
          </Button>
        </div>
      }
    >
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 bg-black/20 p-1.5 rounded-2xl w-fit border border-white/5">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-300",
            activeTab === 'overview'
              ? "bg-gradient-to-r from-brand to-indigo-600 text-white shadow-lg shadow-brand/30"
              : "text-[var(--text-muted)] hover:text-white"
          )}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={cn(
            "px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-300",
            activeTab === 'monthly'
              ? "bg-gradient-to-r from-brand to-indigo-600 text-white shadow-lg shadow-brand/30"
              : "text-[var(--text-muted)] hover:text-white"
          )}
        >
          Monthly Collections
        </button>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Main Balance Card */}
          <div className="bg-gradient-to-br from-brand/20 via-[var(--bg-surface)] to-[var(--bg-raised)] rounded-3xl p-8 border border-brand/20 mb-8 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 right-0 w-96 h-96 bg-brand rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                  <p className="text-brand font-bold text-xs uppercase tracking-widest mb-2">{t('totalNetBalance')}</p>
                  <div className="flex items-center gap-6">
                    <h2 className="text-5xl lg:text-6xl font-black text-[var(--text-primary)] tracking-tight">
                      {isBalanceHidden ? '••••••••' : formatCurrency(totalBalance)}
                    </h2>
                    <button
                      onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                      className="p-4 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-2xl transition-all border border-white/10"
                    >
                      {isBalanceHidden ? <EyeOff size={24} /> : <Eye size={24} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openModal('income')}
                    className="flex items-center gap-3 px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-emerald-500/30 transition-all"
                  >
                    <Plus size={20} /> Add Income
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openModal('expense')}
                    className="flex items-center gap-3 px-6 py-4 bg-rose-500 hover:bg-rose-400 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-rose-500/30 transition-all"
                  >
                    <Minus size={20} /> Add Expense
                  </motion.button>
                </div>
              </div>

              {/* Financial Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-black/20 backdrop-blur-md rounded-2xl p-5 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-emerald-400"><TrendingUp size={20} /></span>
                    <span className={cn("flex items-center gap-1 text-xs font-bold", incomeChange >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {incomeChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {Math.abs(incomeChange)}%
                    </span>
                  </div>
                  <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mb-1">{t("incomeThisMonth")}</p>
                  <p className="text-2xl font-black text-emerald-400">{formatCurrency(incomeThisMonth)}</p>
                </div>

                <div className="bg-black/20 backdrop-blur-md rounded-2xl p-5 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-rose-400"><TrendingDown size={20} /></span>
                  </div>
                  <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mb-1">{t("expensesThisMonth")}</p>
                  <p className="text-2xl font-black text-rose-400">{formatCurrency(expenseThisMonth)}</p>
                </div>

                <div className="bg-black/20 backdrop-blur-md rounded-2xl p-5 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-brand"><CreditCard size={20} /></span>
                  </div>
                  <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mb-1">{t("fixedIncomeMonth")}</p>
                  <p className="text-2xl font-black text-[var(--text-primary)]">{formatCurrency(recurringIncome)}</p>
                </div>

                <div className="bg-black/20 backdrop-blur-md rounded-2xl p-5 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-amber-400"><PieChart size={20} /></span>
                  </div>
                  <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mb-1">{t("profitRatio")}</p>
                  <p className="text-2xl font-black text-brand">
                    {totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <Card className="overflow-hidden border-[var(--border-subtle)]">
            <CardHeader className="flex flex-row items-center justify-between border-b border-[var(--border-subtle)] bg-black/20">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Wallet size={16} className="text-brand" /> Recent Transactions
              </CardTitle>
              <div className="flex gap-3">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="h-9 px-3 bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-xl text-xs font-bold focus:outline-none"
                >
                  <option value="all">{t("allTypes")}</option>
                  <option value="income">{t("incomeOnly")}</option>
                  <option value="expense">{t("expensesOnly")}</option>
                </select>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {filteredTransactions.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-[var(--bg-surface)] flex items-center justify-center mx-auto mb-4">
                    <Wallet size={24} className="text-[var(--text-muted)]" />
                  </div>
                  <p className="text-lg font-bold text-[var(--text-primary)] mb-2">{t("noTransactionsYet")}</p>
                  <p className="text-sm text-[var(--text-muted)] mb-4">{t("startByAddingTx")}</p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="secondary" onClick={() => openModal('income')}>
                      <Plus size={16} className="mr-2" /> Add Income
                    </Button>
                    <Button variant="secondary" onClick={() => openModal('expense')}>
                      <Plus size={16} className="mr-2" /> Add Expense
                    </Button>
                  </div>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 text-[var(--text-muted)] text-[10px] uppercase tracking-wider font-bold">
                      <th className="p-4 pl-6">Description</th>
                      <th className="p-4">{t("categoryHeader")}</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">{t("typeHeader")}</th>
                      <th className="p-4">{t("sourceHeader")}</th>
                      <th className="p-4 text-right pr-6">Amount</th>
                      <th className="p-4 text-right pr-6">{t("actionsHeader")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {filteredTransactions.map((trx, i) => (
                      <motion.tr
                        key={trx._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-[var(--bg-surface)]/50 transition-colors"
                      >
                        <td className="p-4 pl-6">
                          <span className="font-medium text-[var(--text-primary)]">{trx.description}</span>
                        </td>
                        <td className="p-4">
                          <Badge variant="muted" className="bg-white/5 border-none">{trx.category || 'General'}</Badge>
                        </td>
                        <td className="p-4 text-sm text-[var(--text-secondary)]">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-[var(--text-muted)]" />
                            {formatDate(trx.date)}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant={trx.type === 'income' ? 'success' : 'danger'}>
                            {trx.type === 'income' ? 'Income' : 'Expense'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="text-xs text-[var(--text-muted)]">{trx.source || 'Manual'}</span>
                        </td>
                        <td className={cn("p-4 pr-6 text-right font-bold text-sm", trx.type === 'income' ? 'text-emerald-400' : 'text-rose-400')}>
                          {trx.type === 'income' ? '+' : '-'}{formatCurrency(trx.amountCents || 0)}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <button
                            onClick={() => setDeleteConfirmId(trx._id)}
                            className="p-2 text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>

          <TransactionModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            type={modalType}
          />

          <ConfirmDialog
            isOpen={!!deleteConfirmId}
            onClose={() => setDeleteConfirmId(null)}
            onConfirm={handleDeleteTransaction}
            title="Delete Transaction?"
            description="This will permanently remove this record from your history."
            confirmText="Yes, Delete"
            cancelText="Cancel"
            variant="danger"
          />
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <RecurringCollectionsView />
        </motion.div>
      )}
    </PageWrapper>
  )
}
