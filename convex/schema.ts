import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── AUTH & IDENTITY ───────────────────────────────────────────────────────
  users: defineTable({
    email: v.string(),
    passwordHash: v.optional(v.string()),
    passwordSalt: v.optional(v.string()),
    name: v.optional(v.string()),
    role: v.optional(v.string()), // 'owner' | 'admin' | 'staff' | 'viewer'
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  }).index("by_token", ["token"]),

  // ── CRM & LIFECYCLE ────────────────────────────────────────────────────────
  clients: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    status: v.optional(v.string()), // 'lead' | 'active' | 'at_risk' | 'suspended' | 'archived'
    lifecycle_stage: v.optional(v.string()), // 'discovery' | 'onboarding' | 'retaining'
    balanceCents: v.optional(v.number()), // Net balance from ledger
    revenueCents: v.optional(v.number()), // Total income from ledger
    subscription: v.optional(v.object({
      amountCents: v.optional(v.number()),
      amount: v.optional(v.number()), // Legacy
      dueDay: v.number(),
      paidMonths: v.array(v.number()),
      monthAmounts: v.optional(v.array(v.object({
        month: v.number(),
        amountCents: v.optional(v.number()),
        amount: v.optional(v.number()), // Legacy
      }))),
    })),
    address: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    avatarId: v.optional(v.id("_storage")),
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  // ── DOUBLE-ENTRY ACCOUNTING (LEGAL GRADE) ─────────────────────────────────
  ledger_accounts: defineTable({
    userId: v.id("users"),
    name: v.string(), // 'Cash', 'Revenue', 'AR', 'Expenses'
    code: v.string(), // '1000', '4000', etc.
    type: v.string(), // 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
    parentAccountId: v.optional(v.id("ledger_accounts")),
  }).index("by_userId", ["userId"])
    .index("by_code", ["code"]),

  ledger_entries: defineTable({
    userId: v.id("users"),
    accountId: v.id("ledger_accounts"),
    transactionId: v.id("transactions"),
    debitCents: v.number(),
    creditCents: v.number(),
    description: v.string(),
    date: v.number(),
  }).index("by_userId", ["userId"])
    .index("by_transactionId", ["transactionId"])
    .index("by_accountId", ["accountId"]),

  transactions: defineTable({
    userId: v.id("users"),
    type: v.string(), // 'invoice_issue' | 'payment_received' | 'expense_logged'
    status: v.optional(v.string()), // 'posted' | 'voided'
    date: v.number(),
    description: v.string(),
    referenceId: v.optional(v.string()), // ID of related record (payment, invoice)
    metadata: v.optional(v.string()), // JSON metadata
    amountCents: v.optional(v.number()), // For manual transactions
    amount: v.optional(v.number()), // Legacy
    category: v.optional(v.string()), 
    source: v.optional(v.string()),
    clientId: v.optional(v.string()), // Client ID for subscription tracking
    subscriptionMonth: v.optional(v.number()), // Month for subscription payments
    subscriptionYear: v.optional(v.number()), // Year for subscription payments
    subscriptionRefId: v.optional(v.string()), // Unique ref for subscription payment deduplication
    createdAt: v.number(),
  }).index("by_userId", ["userId"])
    .index("by_referenceId", ["referenceId"])
    .index("by_subscriptionRefId", ["subscriptionRefId"]),

  // ── CORE MODULES ──────────────────────────────────────────────────────────
  projects: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    clientId: v.id("clients"),
    status: v.string(), 
    budgetCents: v.optional(v.number()),
    steps: v.optional(v.array(v.object({
      id: v.string(),
      title: v.string(),
      isCompleted: v.boolean(),
    }))),
    deadline: v.optional(v.number()),
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"])
    .index("by_clientId", ["clientId"]),

  invoices: defineTable({
    invoiceNumber: v.string(),
    clientId: v.id("clients"),
    projectId: v.optional(v.id("projects")),
    totalAmountCents: v.number(),
    status: v.string(), // 'draft' | 'sent' | 'paid' | 'overdue' | 'void'
    issueDate: v.number(),
    dueDate: v.optional(v.number()),
    lineItems: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      unitPriceCents: v.number(),
    })),
    userId: v.id("users"),
    createdAt: v.number(),
  }).index("by_userId", ["userId"])
    .index("by_clientId", ["clientId"]),

  payments: defineTable({
    clientId: v.id("clients"),
    projectId: v.optional(v.id("projects")),
    invoiceId: v.optional(v.id("invoices")),
    amountCents: v.optional(v.number()),
    amount: v.optional(v.number()), // Legacy
    lineItems: v.optional(v.array(v.any())), // Legacy
    status: v.string(), // 'pending' | 'paid' | 'failed'
    paidAt: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    paymentMethod: v.optional(v.string()),
    currency: v.optional(v.string()),
    description: v.optional(v.string()),
    subscriptionMonth: v.optional(v.number()),
    subscriptionYear: v.optional(v.number()),
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_userId", ["userId"])
    .index("by_clientId", ["clientId"])
    .index("by_invoiceId", ["invoiceId"]),

  // ── EVENT-DRIVEN & ANALYTICS ─────────────────────────────────────────────
  system_events: defineTable({
    userId: v.id("users"),
    type: v.string(), // e.g., 'PAYMENT_RECEIVED'
    payload: v.string(), // JSON string
    processed: v.boolean(),
    timestamp: v.number(),
  }).index("by_userId", ["userId"])
    .index("by_processed", ["processed"]),

  aggregates: defineTable({
    userId: v.id("users"),
    key: v.string(), // e.g., 'revenue:2024-05' or 'client:id:total_paid'
    valueCents: v.number(),
    lastUpdated: v.number(),
  }).index("by_userId_key", ["userId", "key"]),

  // ── AUDIT & COMPLIANCE ────────────────────────────────────────────────────
  audit_logs: defineTable({
    userId: v.id("users"),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    prevValue: v.optional(v.string()), // For versioning
    newValue: v.optional(v.string()),
    hash: v.optional(v.string()), // For tamper-proof verification
    timestamp: v.number(),
  }).index("by_entity", ["entityType", "entityId"])
    .index("by_userId", ["userId"]),

  // ── STUDIO UTILITIES ──────────────────────────────────────────────────────
  tasks: defineTable({
    title: v.string(),
    status: v.string(), 
    priority: v.string(), 
    dueDate: v.optional(v.number()),
    projectId: v.optional(v.id("projects")),
    clientId: v.optional(v.id("clients")),
    description: v.optional(v.string()),
    userId: v.id("users"),
    order: v.number(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"])
    .index("by_projectId", ["projectId"]),

  pipeline_stages: defineTable({
    name: v.string(),
    slug: v.string(), 
    order: v.number(),
    userId: v.id("users"),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  settings: defineTable({
    userId: v.id("users"),
    theme: v.optional(v.string()),
    studioName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    website: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  notes: defineTable({
    userId: v.id("users"),
    clientId: v.optional(v.id("clients")),
    projectId: v.optional(v.id("projects")),
    content: v.string(),
    color: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  calendar_events: defineTable({
    userId: v.id("users"),
    title: v.string(),
    type: v.string(),
    startAt: v.number(),
    endAt: v.optional(v.number()),
    allDay: v.optional(v.boolean()),
    clientId: v.optional(v.id("clients")),
    projectId: v.optional(v.id("projects")),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  publishing_queue: defineTable({
    userId: v.id("users"),
    title: v.string(),
    platform: v.string(),
    status: v.string(),
    publishDate: v.optional(v.number()),
    clientId: v.optional(v.id("clients")),
    projectId: v.optional(v.id("projects")),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  task_stages: defineTable({
    name: v.string(),
    slug: v.string(),
    color: v.optional(v.string()),
    order: v.number(),
    userId: v.id("users"),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),
});
