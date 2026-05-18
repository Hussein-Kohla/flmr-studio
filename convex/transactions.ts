import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { requireUser, toCents, logAction } from "./helpers";
import { paginationOptsValidator } from "convex/server";

export const getTransactions = query({
  args: { 
    token: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    return await ctx.db
      .query("transactions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// Query to get transactions for a specific client (including subscription payments)
export const getTransactionsByClient = query({
  args: { 
    token: v.string(),
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const allTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
    
    return allTransactions.filter(t => t.clientId === args.clientId);
  },
});

export const createTransaction = mutation({
  args: {
    token: v.string(),
    type: v.string(),
    amount: v.number(),
    description: v.string(),
    category: v.string(),
    date: v.number(),
    status: v.optional(v.string()),
    source: v.optional(v.string()),
    clientId: v.optional(v.string()),
    subscriptionMonth: v.optional(v.number()),
    subscriptionYear: v.optional(v.number()),
    subscriptionRefId: v.optional(v.string()), // Unique ref for subscription payments
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    
    // Check for duplicate subscription payment
    if (args.subscriptionRefId && args.clientId && args.subscriptionMonth !== undefined && args.subscriptionYear !== undefined) {
      const existing = await ctx.db
        .query("transactions")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();
      
      const duplicate = existing.find(t => 
        t.clientId === args.clientId && 
        t.subscriptionMonth === args.subscriptionMonth && 
        t.subscriptionYear === args.subscriptionYear &&
        t.status !== 'voided'
      );
      
      if (duplicate) {
        throw new Error(`Payment already exists for ${args.clientId} - ${args.subscriptionMonth}/${args.subscriptionYear}`);
      }
    }
    
    const amountCents = toCents(args.amount);

    const transactionId = await ctx.db.insert("transactions", {
      userId: user._id,
      type: args.type,
      status: args.status || "posted",
      amountCents,
      description: args.description,
      category: args.category,
      date: args.date,
      source: args.source || "Manual",
      clientId: args.clientId,
      subscriptionMonth: args.subscriptionMonth,
      subscriptionYear: args.subscriptionYear,
      subscriptionRefId: args.subscriptionRefId,
      createdAt: Date.now(),
    });

    // Update Client Balance & Revenue if clientId is provided
    if (args.clientId && args.type === 'income') {
      const client = await ctx.db.get(args.clientId as Id<"clients">);
      if (client) {
        await ctx.db.patch(client._id, {
          balanceCents: (client.balanceCents || 0) + amountCents,
        });
      }
    }

    await logAction(ctx, user._id, "CREATE_TRANSACTION", "transactions", transactionId, { amountCents });
    return transactionId;
  },
});

export const deleteTransaction = mutation({
  args: {
    token: v.string(),
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const tx = await ctx.db.get(args.transactionId);
    if (!tx || tx.userId !== user._id) throw new Error("Unauthorized");

    // Reverse balance & revenue if it was an active client transaction
    if (tx.clientId && (tx.status === 'posted' || tx.status === 'paid')) {
      const client = await ctx.db.get(tx.clientId as Id<"clients">);
      if (client) {
        const amount = tx.amountCents || 0;
        const balanceChange = tx.type === 'income' ? -amount : amount;
        const revenueChange = tx.type === 'income' ? -amount : 0;
        await ctx.db.patch(client._id, {
          balanceCents: (client.balanceCents || 0) + balanceChange,
          revenueCents: (client.revenueCents || 0) + revenueChange,
        });
      }
    }

    await logAction(ctx, user._id, "DELETE_TRANSACTION", "transactions", args.transactionId, {});
    return await ctx.db.delete(args.transactionId);
  },
});

// Update transaction (for editing payment details)
export const updateTransaction = mutation({
  args: {
    token: v.string(),
    transactionId: v.id("transactions"),
    amount: v.optional(v.number()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const tx = await ctx.db.get(args.transactionId);
    if (!tx || tx.userId !== user._id) throw new Error("Unauthorized");

    const updates: any = {};
    if (args.amount !== undefined) {
      const newAmountCents = toCents(args.amount);
      updates.amountCents = newAmountCents;
      
      // Update balance & revenue if amount changed and it's a client transaction
      if (tx.clientId && (tx.status === 'posted' || tx.status === 'paid')) {
        const diff = newAmountCents - (tx.amountCents || 0);
        const balanceChange = tx.type === 'income' ? diff : -diff;
        const revenueChange = tx.type === 'income' ? diff : 0;
        const client = await ctx.db.get(tx.clientId as Id<"clients">);
        if (client) {
          await ctx.db.patch(client._id, {
            balanceCents: (client.balanceCents || 0) + balanceChange,
            revenueCents: (client.revenueCents || 0) + revenueChange,
          });
        }
      }
    }
    
    if (args.status !== undefined) {
      updates.status = args.status;
      // Handle status toggling impact on balance & revenue
      if (tx.clientId) {
        const wasActive = tx.status === 'posted' || tx.status === 'paid';
        const nowActive = args.status === 'posted' || args.status === 'paid';
        
        if (wasActive !== nowActive) {
          const client = await ctx.db.get(tx.clientId as Id<"clients">);
          if (client) {
            const amount = updates.amountCents || tx.amountCents || 0;
            const multiplier = nowActive ? 1 : -1;
            const balanceChange = (tx.type === 'income' ? amount : -amount) * multiplier;
            const revenueChange = (tx.type === 'income' ? amount : 0) * multiplier;
            await ctx.db.patch(client._id, {
              balanceCents: (client.balanceCents || 0) + balanceChange,
              revenueCents: (client.revenueCents || 0) + revenueChange,
            });
          }
        }
      }
    }

    if (args.description !== undefined) updates.description = args.description;
    if (args.date !== undefined) updates.date = args.date;

    await ctx.db.patch(args.transactionId, updates);
    await logAction(ctx, user._id, "UPDATE_TRANSACTION", "transactions", args.transactionId, updates);
    return args.transactionId;
  },
});

// Update transaction status (void or post)
export const updateTransactionStatus = mutation({
  args: {
    token: v.string(),
    transactionId: v.id("transactions"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const tx = await ctx.db.get(args.transactionId);
    if (!tx || tx.userId !== user._id) throw new Error("Unauthorized");

    await ctx.db.patch(args.transactionId, { status: args.status });
    await logAction(ctx, user._id, "UPDATE_TRANSACTION_STATUS", "transactions", args.transactionId, { status: args.status });
    return args.transactionId;
  },
});
