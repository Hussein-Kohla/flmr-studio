// ── Payment & Invoice types ───────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'

export interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
}

export interface Payment {
  id: string
  clientId: string
  projectId?: string
  status: PaymentStatus
  lineItems: InvoiceLineItem[]
  total: number
  currency: string
  dueDate?: string
  paidAt?: string
  createdAt: string
}

export interface PaymentFormValues {
  clientId: string
  projectId?: string
  lineItems: InvoiceLineItem[]
  currency: string
  dueDate?: string
}
