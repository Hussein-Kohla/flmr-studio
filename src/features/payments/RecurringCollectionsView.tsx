import { useQuery, useMutation } from 'convex/react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/../convex/_generated/api'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, cn } from '@/lib/utils'
import { User, CheckCircle2, AlertCircle, Calendar, Search, ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/components/ui/Toast'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function RecurringCollectionsView() {
  const { token } = useAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedClientForPayment, setSelectedClientForPayment] = useState<any>(null)
  const [paymentMonth, setPaymentMonth] = useState(new Date().getMonth())
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear())
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const clientsData = useQuery(api.clients.getClients, token ? { token, paginationOpts: { numItems: 100, cursor: null } } : 'skip')
  const transactionsData = useQuery(api.transactions.getTransactions, token ? { token, paginationOpts: { numItems: 1000, cursor: null } } : 'skip')
  const createPayment = useMutation(api.transactions.createTransaction)

  if (clientsData === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-brand)]"></div>
      </div>
    )
  }

  const clients = clientsData.page || []
  const transactions = transactionsData?.page || []
  const monthName = MONTHS[selectedMonth]

  // Filter clients who have a subscription set up or are tagged with 'تحصيل'
  const subscriptionClients = clients.filter(c =>
    (c.subscription && (c.subscription.amountCents ?? 0) > 0) ||
    c.tags?.includes('تحصيل')
  )

  const filteredClients = subscriptionClients.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Check if a client has paid for the selected month (using transactions only)
  const hasPaidForMonth = (client: any, month: number, year: number) => {
    // Check in transactions for this specific client/month/year
    const hasTransaction = transactions.find(t =>
      t.clientId === client._id &&
      t.subscriptionMonth === month &&
      t.subscriptionYear === year &&
      (t.status === 'posted' || t.status === 'paid')
    )
    return !!hasTransaction
  }

  // Get payment details for a client/month/year
  const getPaymentDetails = (client: any, month: number, year: number) => {
    return transactions.find(t =>
      t.clientId === client._id &&
      t.subscriptionMonth === month &&
      t.subscriptionYear === year &&
      (t.status === 'posted' || t.status === 'paid')
    )
  }

  // Calculate total expected for selected month (all subscription clients)
  const totalExpected = subscriptionClients.reduce((acc, c) => acc + (c.subscription?.amountCents || 0), 0)

  // Calculate total collected for selected month (only clients who paid based on transactions)
  const totalCollected = subscriptionClients
    .filter(c => hasPaidForMonth(c, selectedMonth, selectedYear))
    .reduce((acc, c) => {
      // Get the actual paid amount from the transaction
      const payment = getPaymentDetails(c, selectedMonth, selectedYear)
      return acc + (payment?.amountCents || c.subscription?.amountCents || 0)
    }, 0)

  const handleOpenPaymentModal = (client: any) => {
    setSelectedClientForPayment(client)
    setPaymentMonth(selectedMonth)
    setPaymentYear(selectedYear)
    setShowPaymentModal(true)
  }

  // Check if payment exists for a specific month
  const checkPaymentExists = (client: any, month: number, year: number) => {
    return transactions.find(t =>
      t.clientId === client._id &&
      t.subscriptionMonth === month &&
      t.subscriptionYear === year &&
      (t.status === 'posted' || t.status === 'paid')
    )
  }

  const handleConfirmPayment = async () => {
    if (!token || !selectedClientForPayment) return

    // Check if payment already exists
    const existingPayment = checkPaymentExists(selectedClientForPayment, paymentMonth, paymentYear)
    if (existingPayment) {
      toast(`${selectedClientForPayment.name} already paid for ${MONTHS[paymentMonth]} ${paymentYear}!`, "warning")
      setShowPaymentModal(false)
      return
    }

    try {
      const amount = (selectedClientForPayment.subscription?.amountCents || 0) / 100
      const subscriptionRefId = `sub_${selectedClientForPayment._id}_${paymentYear}_${paymentMonth}`

      await createPayment({
        token,
        clientId: selectedClientForPayment._id,
        type: 'income',
        amount,
        description: `Monthly Collection - ${MONTHS[paymentMonth]} ${paymentYear}`,
        category: 'Subscriptions',
        status: 'paid',
        date: Date.now(),
        source: 'Subscriptions',
        subscriptionMonth: paymentMonth,
        subscriptionYear: paymentYear,
        subscriptionRefId,
      })
      toast(`${selectedClientForPayment.name}'s payment for ${MONTHS[paymentMonth]} ${paymentYear} recorded!`, "success")
      setShowPaymentModal(false)
      setSelectedClientForPayment(null)
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        toast(`Payment already exists for ${MONTHS[paymentMonth]} ${paymentYear}!`, "warning")
      } else {
        toast("Failed to record payment", "error")
      }
    }
  }

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  const handleGoToToday = () => {
    setSelectedMonth(new Date().getMonth())
    setSelectedYear(new Date().getFullYear())
  }

  return (
    <div className="space-y-6">
      {/* Header Info Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card glass className="p-8 border-brand/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 group-hover:rotate-12 transition-all duration-700">
            <Calendar size={120} />
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Monthly Collections</h3>
            <p className="text-[var(--text-muted)] max-w-md font-medium">
              Overview of recurring monthly income. Select a month to view and record payments.
            </p>

            {/* Month Selector */}
            <div className="flex items-center gap-4 mt-6 mb-8">
              <button
                onClick={handlePrevMonth}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10"
              >
                <ChevronLeft size={20} className="text-white" />
              </button>

              <div className="flex items-center gap-3 px-6 py-3 bg-brand/20 rounded-xl border border-brand/30">
                <Calendar size={20} className="text-brand" />
                <span className="text-xl font-black text-white">
                  {monthName} {selectedYear}
                </span>
              </div>

              <button
                onClick={handleNextMonth}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10"
              >
                <ChevronRight size={20} className="text-white" />
              </button>

              <button
                onClick={handleGoToToday}
                className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 text-sm font-bold"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Total Expected</span>
                <span className="text-3xl font-black text-white tracking-tighter">
                  {formatCurrency(totalExpected)}
                </span>
              </div>
              <div className="h-12 w-px bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Collected</span>
                <span className="text-3xl font-black text-emerald-400 tracking-tighter">
                  {formatCurrency(totalCollected)}
                </span>
              </div>
              <div className="h-12 w-px bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Remaining</span>
                <span className="text-3xl font-black text-amber-400 tracking-tighter">
                  {formatCurrency(totalExpected - totalCollected)}
                </span>
              </div>
              <div className="h-12 w-px bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Client Count</span>
                <span className="text-3xl font-black text-white tracking-tighter">{subscriptionClients.length}</span>
              </div>
              <div className="h-12 w-px bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Progress</span>
                <span className="text-3xl font-black text-brand tracking-tighter">
                  {totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Search Bar */}
      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[var(--color-brand)] transition-colors" size={18} />
        <input
          type="text"
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-[var(--color-brand)] transition-all shadow-sm"
        />
      </div>

      {/* Client List */}
      <motion.div layout className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {filteredClients.map((client, i) => {
            const isPaid = hasPaidForMonth(client, selectedMonth, selectedYear)
            const dueDay = client.subscription?.dueDay || 1
            const amountCents = client.subscription?.amountCents || 0

            return (
              <motion.div
                key={client._id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card glass className={cn(
                  "p-5 border-white/5 transition-all duration-300 group flex items-center justify-between gap-4 overflow-hidden relative",
                  "hover:bg-white/[0.04] hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5",
                  isPaid && "opacity-60"
                )}>
                  <div className="absolute inset-y-0 left-0 w-1 bg-brand scale-y-0 group-hover:scale-y-100 transition-transform duration-500" />

                  <div className="flex items-center gap-5 min-w-0 flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-black/40 flex items-center justify-center text-brand group-hover:bg-brand/10 group-hover:rotate-3 transition-all shrink-0 shadow-inner">
                      <User size={28} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-white text-lg group-hover:text-brand transition-colors truncate">{client.name}</h4>
                      <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] truncate">{client.company || 'Private Client'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-10 px-10 border-x border-white/5 hidden md:flex">
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Monthly Amount</span>
                      <span className={cn(
                        "text-base font-black tracking-tighter",
                        amountCents > 0 ? "text-white" : "text-rose-500"
                      )}>
                        {amountCents > 0 ? formatCurrency(amountCents) : '0.00'}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Due Day</span>
                      <span className="text-base font-black text-white tracking-tighter">{dueDay}th</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Status</span>
                      <span className={cn(
                        "text-base font-black tracking-tighter",
                        isPaid ? "text-emerald-400" : "text-amber-400"
                      )}>
                        {isPaid ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="min-w-[160px] flex justify-end">
                    {isPaid ? (
                      <div className="flex items-center gap-2 text-emerald-400 px-5 py-2.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                        <CheckCircle2 size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Collected</span>
                      </div>
                    ) : (
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          size="sm"
                          className="h-11 px-8 rounded-2xl font-black uppercase tracking-[0.2em] text-[9px] bg-brand text-white shadow-lg shadow-brand/20 border-none"
                          onClick={() => handleOpenPaymentModal(client)}
                          disabled={amountCents === 0}
                        >
                          Mark as Paid
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>

      {filteredClients.length === 0 && (
        <div className="py-20 flex flex-col items-center text-[var(--text-muted)] bg-white/5 rounded-[32px] border border-white/5">
          <AlertCircle size={48} className="mb-4 opacity-20" />
          <p className="font-bold uppercase tracking-widest text-sm">No subscription clients found</p>
        </div>
      )}

      {/* Payment Month Selection Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedClientForPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#121214] border border-white/10 rounded-[32px] p-8 w-full max-w-md shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center">
                  <Calendar size={28} className="text-brand" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-white">Select Payment Month</h4>
                  <p className="text-white/40 text-sm">{selectedClientForPayment.name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-2">Month</label>
                  <div className="relative">
                    <select
                      value={paymentMonth}
                      onChange={(e) => setPaymentMonth(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-brand appearance-none cursor-pointer"
                    >
                      {MONTHS.map((month, i) => (
                        <option key={month} value={i} className="bg-[#121214]">{month}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-2">Year</label>
                  <div className="relative">
                    <select
                      value={paymentYear}
                      onChange={(e) => setPaymentYear(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-brand appearance-none cursor-pointer"
                    >
                      {[2024, 2025, 2026, 2027].map((year) => (
                        <option key={year} value={year} className="bg-[#121214]">{year}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                  </div>
                </div>

                <div className="p-4 bg-brand/10 border border-brand/20 rounded-2xl mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm font-bold">Amount</span>
                    <span className="text-white font-black text-lg">
                      {formatCurrency(selectedClientForPayment.subscription?.amountCents || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <Button
                  variant="secondary"
                  className="flex-1 py-4 rounded-2xl font-bold bg-white/5 border-white/10 hover:bg-white/10"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 py-4 rounded-2xl font-black bg-brand hover:bg-brand/90 shadow-lg shadow-brand/20"
                  onClick={handleConfirmPayment}
                >
                  Confirm Payment
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
