import { MutationCtx, QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * DOUBLE-ENTRY LEDGER SERVICE
 * 
 * In a true double-entry system:
 * Total Debits must always equal Total Credits for any transaction.
 */

export const LedgerService = {
  /**
   * ATOMIC: Post a balanced ledger transaction
   */
  async postTransaction(
    ctx: MutationCtx,
    userId: Id<"users">,
    params: {
      type: string;
      description: string;
      date: number;
      referenceId?: string;
      entries: {
        accountCode: string; // e.g. '1000' for Cash
        debitCents: number;
        creditCents: number;
        description: string;
      }[];
    }
  ) {
    // 1. Validate Balance (Sum Debits === Sum Credits)
    const totalDebit = params.entries.reduce((sum, e) => sum + e.debitCents, 0);
    const totalCredit = params.entries.reduce((sum, e) => sum + e.creditCents, 0);

    if (totalDebit !== totalCredit) {
      throw new Error(`Accounting Error: Transaction is not balanced. Debits (${totalDebit}) !== Credits (${totalCredit})`);
    }

    // 2. Create the Transaction Header
    const transactionId = await ctx.db.insert("transactions", {
      userId,
      type: params.type,
      status: "posted",
      date: params.date,
      description: params.description,
      referenceId: params.referenceId,
      createdAt: Date.now(),
    });

    // 3. Post Individual Ledger Entries
    for (const entry of params.entries) {
      // Find account by code
      const account = await ctx.db
        .query("ledger_accounts")
        .withIndex("by_code", (q) => q.eq("code", entry.accountCode))
        .unique();

      if (!account) throw new Error(`Accounting Error: Account code ${entry.accountCode} not found.`);

      await ctx.db.insert("ledger_entries", {
        userId,
        accountId: account._id,
        transactionId,
        debitCents: entry.debitCents,
        creditCents: entry.creditCents,
        description: entry.description,
        date: params.date,
      });

      // 4. Update Running Aggregate for Account (Precomputed Analytics)
      const balanceChange = account.type === 'asset' || account.type === 'expense'
        ? entry.debitCents - entry.creditCents
        : entry.creditCents - entry.debitCents;

      await this.updateAggregate(ctx, userId, `account_balance:${account.code}`, balanceChange);
    }

    return transactionId;
  },

  /**
   * Precomputed Aggregates Utility
   */
  async updateAggregate(ctx: MutationCtx, userId: Id<"users">, key: string, changeCents: number) {
    const existing = await ctx.db
      .query("aggregates")
      .withIndex("by_userId_key", (q) => q.eq("userId", userId).eq("key", key))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        valueCents: existing.valueCents + changeCents,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("aggregates", {
        userId,
        key,
        valueCents: changeCents,
        lastUpdated: Date.now(),
      });
    }
  }
};
