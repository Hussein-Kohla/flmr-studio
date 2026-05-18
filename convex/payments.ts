import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, toCents, fromCents, logAction } from "./helpers";
import { paginationOptsValidator } from "convex/server";
import { recordPayment } from "./financials";

export const getPayments = query({
  args: {
    token: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx, args.token);
    return await ctx.db
      .query("payments")
      .withIndex("by_userId", (q) => q.eq("userId", userId._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const createPayment = mutation({
  args: {
    token: v.string(),
    clientId: v.id("clients"),
    projectId: v.optional(v.id("projects")),
    amount: v.number(), // Input decimal
    currency: v.string(),
    dueDate: v.optional(v.number()),
    status: v.optional(v.string()),
    subscriptionMonth: v.optional(v.number()),
    subscriptionYear: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const amountCents = toCents(args.amount);

    if (isNaN(amountCents) || amountCents <= 0) {
      throw new Error("Invalid amount");
    }

    // 1. SIMPLE DEDUPLICATION: Prevent same amount for same client in last 30 seconds
    const recentDuplicate = await ctx.db
      .query("payments")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .filter((q) =>
        q.and(
          q.eq(q.field("amountCents"), amountCents),
          q.gt(q.field("createdAt"), Date.now() - 30000) // 30 seconds
        )
      )
      .first();

    if (recentDuplicate) {
      // If it's a double-click on 'paid', and we have a pending one, upgrade it.
      if (args.status === 'paid' && recentDuplicate.status === 'pending') {
        return await recordPayment(ctx, user._id, {
          clientId: args.clientId,
          amountCents,
          description: recentDuplicate.description || '',
          paymentId: recentDuplicate._id,
        });
      }
      return recentDuplicate._id;
    }

    if (args.status === 'paid') {
      const client = await ctx.db.get(args.clientId);
      const project = args.projectId ? await ctx.db.get(args.projectId) : null;

      const desc = args.description || (args.subscriptionMonth !== undefined
        ? `Subscription: ${client?.name} - ${args.subscriptionMonth + 1}/${args.subscriptionYear}`
        : `Payment: ${project?.title || 'Project'}`);

      return await recordPayment(ctx, user._id, {
        clientId: args.clientId,
        projectId: args.projectId,
        amountCents,
        currency: args.currency,
        description: desc,
        source: args.subscriptionMonth !== undefined ? "Subscriptions" : "Projects",
        subscriptionMonth: args.subscriptionMonth,
        subscriptionYear: args.subscriptionYear,
        dueDate: args.dueDate,
      });
    }

    const paymentId = await ctx.db.insert("payments", {
      userId: user._id,
      clientId: args.clientId,
      projectId: args.projectId,
      amountCents,
      currency: args.currency,
      status: args.status || "pending",
      dueDate: args.dueDate,
      description: args.description || `Payment: Project`,
      subscriptionMonth: args.subscriptionMonth,
      subscriptionYear: args.subscriptionYear,
      createdAt: Date.now(),
    });

    await logAction(ctx, user._id, "CREATE_PAYMENT_PENDING", "payments", paymentId, { amountCents });
    return paymentId;
  },
});

export const updatePaymentStatus = mutation({
  args: {
    token: v.string(),
    paymentId: v.id("payments"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const payment = await ctx.db.get(args.paymentId);
    if (!payment || payment.userId !== user._id) throw new Error("Unauthorized");

    // Prevent redundant updates
    if (payment.status === args.status) return payment._id;

    if (args.status === 'paid' && payment.status !== 'paid') {
      // Check if there's a posted transaction for this SPECIFIC payment Id
      const existingTx = await ctx.db
        .query("transactions")
        .withIndex("by_referenceId", (q) => q.eq("referenceId", payment._id))
        .unique();

      if (existingTx && existingTx.status === "voided") {
        await ctx.db.patch(existingTx._id, { status: "posted" });
        const client = await ctx.db.get(payment.clientId);
        if (client) {
          await ctx.db.patch(client._id, {
            balanceCents: (client.balanceCents || 0) + (payment.amountCents || 0),
            revenueCents: (client.revenueCents || 0) + (payment.amountCents || 0),
          });
        }
      } else if (!existingTx) {
        // ALWAYS use the existing payment._id to record
        await recordPayment(ctx, user._id, {
          clientId: payment.clientId,
          projectId: payment.projectId,
          amountCents: payment.amountCents || 0,
          currency: payment.currency || 'EGP',
          description: payment.description || 'Manual Payment',
          source: payment.subscriptionMonth !== undefined ? "Subscriptions" : "Projects",
          invoiceId: payment.invoiceId,
          paymentId: payment._id, // THIS ENSURES IT'S THE SAME RECORD
        });
      }
      // If existingTx exists and is NOT voided (already posted), do nothing - prevents double-posting

    } else if (args.status === 'pending' && payment.status === 'paid') {
      // Reverse balance propagation if changing back to pending
      const client = await ctx.db.get(payment.clientId);
      if (client) {
        await ctx.db.patch(client._id, {
          balanceCents: (client.balanceCents || 0) - (payment.amountCents || 0),
          revenueCents: (client.revenueCents || 0) - (payment.amountCents || 0),
        });
      }
      // Void linked transaction (don't delete - keeps audit trail)
      const tx = await ctx.db
        .query("transactions")
        .withIndex("by_referenceId", (q) => q.eq("referenceId", payment._id))
        .unique();
      if (tx) {
        await ctx.db.patch(tx._id, { status: "voided" });
      }
    }

    return await ctx.db.patch(args.paymentId, {
      status: args.status,
      paidAt: args.status === 'paid' ? (payment.paidAt || Date.now()) : undefined,
    });
  },
});

export const updatePayment = mutation({
  args: {
    token: v.string(),
    paymentId: v.id("payments"),
    amount: v.optional(v.number()),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const payment = await ctx.db.get(args.paymentId);
    if (!payment || payment.userId !== user._id) throw new Error("Unauthorized");

    const updates: any = {};
    if (args.amount !== undefined) {
      const newAmountCents = toCents(args.amount);
      updates.amountCents = newAmountCents;

      // If payment is already paid, update client balance by the difference
      if (payment.status === 'paid') {
        const diff = newAmountCents - (payment.amountCents || 0);
        if (diff !== 0) {
          const client = await ctx.db.get(payment.clientId);
          if (client) {
            await ctx.db.patch(client._id, {
              balanceCents: (client.balanceCents || 0) + diff,
              revenueCents: (client.revenueCents || 0) + diff,
            });
          }
        }
      }
    }
    if (args.description !== undefined) updates.description = args.description;
    if (args.dueDate !== undefined) updates.dueDate = args.dueDate;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.paymentId, updates);
    await logAction(ctx, user._id, "UPDATE_PAYMENT", "payments", args.paymentId, updates);
  },
});

export const deletePayment = mutation({
  args: {
    token: v.string(),
    paymentId: v.id("payments"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const payment = await ctx.db.get(args.paymentId);
    if (!payment || payment.userId !== user._id) throw new Error("Unauthorized");

    // Deleting a payment should ideally void the linked transaction or deduct from client balance
    const tx = await ctx.db
      .query("transactions")
      .withIndex("by_referenceId", (q) => q.eq("referenceId", args.paymentId))
      .unique();

    if (tx) {
      // Reverse balance propagation
      const client = await ctx.db.get(payment.clientId);
      if (client) {
        const amount = payment.amountCents ?? (payment.amount ? payment.amount * 100 : 0);
        // Since it's a payment, it reduced the balance. Deleting it increases the balance.
        // Actually, in this app, payments INCREASE the balance (credit balance).
        // So deleting a payment DECREASES the balance and revenue.
        await ctx.db.patch(client._id, {
          balanceCents: (client.balanceCents || 0) - amount,
          revenueCents: (client.revenueCents || 0) - amount,
        });
      }
      // Void the transaction instead of deleting? Or delete. 
      // User objective was "hardening", so maybe voiding is better for audit.
      await ctx.db.patch(tx._id, { status: "voided" });
    }

    await logAction(ctx, user._id, "DELETE_PAYMENT", "payments", args.paymentId, { wasPaid: !!tx });
    return await ctx.db.delete(args.paymentId);
  },
});
