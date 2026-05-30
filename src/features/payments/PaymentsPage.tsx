import { useSettings } from '@/hooks/useSettings'
import { PageWrapper } from '@/components/layout/PageWrapper'
import ClientPaymentsView from '@/features/payments/ClientPaymentsView'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export default function PaymentsPage() {
  const { t } = useSettings()
  const [activeTab, setActiveTab] = useState<'ads' | 'all'>('ads')

  return (
    <PageWrapper
      title="الإعلانات والمبالغ"
      subtitle="إدارة المبالغ الممولة والمبالغ الكلية للعملاء"
    >
      <div className="flex gap-2 mb-8 bg-black/20 p-1.5 rounded-2xl w-fit border border-white/5">
        <button
          onClick={() => setActiveTab('ads')}
          className={cn(
            "px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-300",
            activeTab === 'ads'
              ? "bg-gradient-to-r from-brand to-indigo-600 text-white shadow-lg shadow-brand/30"
              : "text-[var(--text-muted)] hover:text-white"
          )}
        >
          الإعلانات الممولة
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            "px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-300",
            activeTab === 'all'
              ? "bg-gradient-to-r from-brand to-indigo-600 text-white shadow-lg shadow-brand/30"
              : "text-[var(--text-muted)] hover:text-white"
          )}
        >
          الفلوس لكل العملاء
        </button>
      </div>

      <ClientPaymentsView filter={activeTab} />
    </PageWrapper>
  )
}
