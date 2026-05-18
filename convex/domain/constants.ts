/**
 * DOMAIN CONSTANTS & BUSINESS RULES
 * 
 * Centralizing all "magic strings" and business logic constants to avoid Implicit Logic.
 */

export const ClientStatus = {
  LEAD: "lead",
  ACTIVE: "active",
  AT_RISK: "at_risk",
  SUSPENDED: "suspended",
  ARCHIVED: "archived",
} as const;

export const LifecycleStage = {
  DISCOVERY: "discovery",
  ONBOARDING: "onboarding",
  RETAINING: "retaining",
} as const;

export const LedgerAccountCode = {
  CASH: "1000",
  ACCOUNTS_RECEIVABLE: "1200",
  REVENUE: "4000",
  EXPENSES: "5000",
} as const;

export const ProjectStatus = {
  DRAFT: "draft",
  IN_REVIEW: "in_review",
  REVISION: "revision",
  APPROVED: "approved",
  DONE: "done",
} as const;

export const TransactionType = {
  INVOICE_ISSUE: "invoice_issue",
  PAYMENT_RECEIVED: "payment_received",
  EXPENSE_LOGGED: "expense_logged",
} as const;
