import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { LedgerService } from "./services/ledger";
import { EventService, AuditService } from "./services/events";
import { LedgerAccountCode, TransactionType, ClientStatus } from "./domain/constants";

/**
 * REFACTORED FINANCIAL ENGINE (Service Layer)
 * 
 * Implements Double-Entry Accounting, Event-Driven side-effects, and Atomicity.
 */

interface PaymentArgs {
  clientId: Id<"clients">;
  projectId?: Id<"projects">;
  invoiceId?: Id<"invoices">;
  amountCents: number;
  paymentMethod?: string;
  description: string;
  currency?: string;
  source?: string;
  subscriptionMonth?: number;
  subscriptionYear?: number;
  dueDate?: number;
  paymentId?: Id<"payments">;
}

/**
 * ATOMIC: Record Payment using Double-Entry
 */
export async function recordPayment(ctx: MutationCtx, userId: Id<"users">, args: PaymentArgs) {
  // 1. Create or Update the Payment Record ( Infrastructure Layer )
  let paymentId = args.paymentId;
  if (paymentId) {
    const existing = await ctx.db.get(paymentId);
    if (existing?.status === "paid") return paymentId; // STOP: Already processed. Prevents doubling.

    await ctx.db.patch(paymentId, {
      amountCents: args.amountCents,
      status: "paid",
      paidAt: Date.now(),
      paymentMethod: args.paymentMethod,
      currency: args.currency,
      description: args.description,
      updatedAt: Date.now(),
    });
  } else {
    paymentId = await ctx.db.insert("payments", {
      userId,
      clientId: args.clientId,
      projectId: args.projectId,
      invoiceId: args.invoiceId,
      amountCents: args.amountCents,
      status: "paid",
      paidAt: Date.now(),
      paymentMethod: args.paymentMethod,
      currency: args.currency,
      description: args.description,
      subscriptionMonth: args.subscriptionMonth,
      subscriptionYear: args.subscriptionYear,
      createdAt: Date.now(),
    });
  }

  // 2. Post to Double-Entry Ledger ( Domain Layer )
  // Logic: Debit CASH, Credit ACCOUNTS RECEIVABLE
  await LedgerService.postTransaction(ctx, userId, {
    type: TransactionType.PAYMENT_RECEIVED,
    description: args.description,
    date: Date.now(),
    referenceId: paymentId,
    entries: [
      {
        accountCode: LedgerAccountCode.CASH,
        debitCents: args.amountCents,
        creditCents: 0,
        description: `Payment from client: ${args.clientId}`,
      },
      {
        accountCode: LedgerAccountCode.ACCOUNTS_RECEIVABLE,
        debitCents: 0,
        creditCents: args.amountCents,
        description: `Settlement of balance for client: ${args.clientId}`,
      }
    ]
  });

  // 3. Update Client Balance ( derived from ledger eventually, but kept here for speed )
  const client = await ctx.db.get(args.clientId);
  if (client) {
    await ctx.db.patch(args.clientId, {
      balanceCents: (client.balanceCents || 0) + args.amountCents, // Paying increases their credit/revenue balance
      revenueCents: (client.revenueCents || 0) + args.amountCents, // Paying increases their total collected
      status: ClientStatus.ACTIVE,
      updatedAt: Date.now(),
    });
  }

  // 4. Dispatch Event ( Event-Driven Architecture )
  await EventService.dispatch(ctx, userId, "PAYMENT_RECEIVED", {
    clientId: args.clientId,
    amountCents: args.amountCents,
    paymentId,
  });

  // 5. Legal Audit
  await AuditService.log(ctx, userId, "RECORD_PAYMENT", "payments", paymentId, null, { amountCents: args.amountCents });

  return paymentId;
}

/**
 * ATOMIC: Issue Invoice using Double-Entry
 */
export async function issueInvoice(ctx: MutationCtx, userId: Id<"users">, args: {
  clientId: Id<"clients">;
  projectId?: Id<"projects">;
  lineItems: { description: string; quantity: number; unitPriceCents: number }[];
}) {
  const totalAmountCents = args.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);

  // 1. Record Invoice
  const invoiceId = await ctx.db.insert("invoices", {
    userId,
    clientId: args.clientId,
    projectId: args.projectId,
    invoiceNumber: `INV-${Date.now()}`,
    totalAmountCents,
    status: "sent",
    issueDate: Date.now(),
    lineItems: args.lineItems,
    createdAt: Date.now(),
  });

  // 2. Double-Entry Posting
  // Logic: Debit ACCOUNTS RECEIVABLE, Credit REVENUE
  await LedgerService.postTransaction(ctx, userId, {
    type: TransactionType.INVOICE_ISSUE,
    description: `Invoice issued to client: ${args.clientId}`,
    date: Date.now(),
    referenceId: invoiceId,
    entries: [
      {
        accountCode: LedgerAccountCode.ACCOUNTS_RECEIVABLE,
        debitCents: totalAmountCents,
        creditCents: 0,
        description: `Uncollected revenue for client: ${args.clientId}`,
      },
      {
        accountCode: LedgerAccountCode.REVENUE,
        debitCents: 0,
        creditCents: totalAmountCents,
        description: `Revenue recognized from invoice ${invoiceId}`,
      }
    ]
  });

  // 3. Update Client Balance
  const client = await ctx.db.get(args.clientId);
  if (client) {
    await ctx.db.patch(args.clientId, {
      balanceCents: (client.balanceCents || 0) - totalAmountCents, // Invoice reduces their credit/revenue balance
      updatedAt: Date.now(),
    });
  }

  return invoiceId;
}
