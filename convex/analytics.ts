import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireUser } from "./helpers";

/**
 * PRECOMPUTED ANALYTICS (Scalability Engine)
 * 
 * Instead of scanning thousands of transactions/payments, 
 * we read directly from materialized aggregate tables.
 */

export const getStudioStats = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const userId = user._id;

    // Read precomputed aggregates
    const revenueKey = `account_balance:4000`; // Revenue Account
    const cashKey = `account_balance:1000`;    // Cash Account
    const arKey = `account_balance:1200`;      // AR Account

    const revenue = await ctx.db
      .query("aggregates")
      .withIndex("by_userId_key", (q) => q.eq("userId", userId).eq("key", revenueKey))
      .unique();
    
    const cash = await ctx.db
      .query("aggregates")
      .withIndex("by_userId_key", (q) => q.eq("userId", userId).eq("key", cashKey))
      .unique();
    
    const accountsReceivable = await ctx.db
      .query("aggregates")
      .withIndex("by_userId_key", (q) => q.eq("userId", userId).eq("key", arKey))
      .unique();

    return {
      totalRevenueCents: revenue?.valueCents || 0,
      cashOnHandCents: cash?.valueCents || 0,
      outstandingBalanceCents: accountsReceivable?.valueCents || 0,
      lastUpdated: Math.max(
        revenue?.lastUpdated || 0, 
        cash?.lastUpdated || 0, 
        accountsReceivable?.lastUpdated || 0
      ),
    };
  },
});

export const getAggregatesByPrefix = query({
  args: { token: v.string(), prefix: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    return await ctx.db
      .query("aggregates")
      .withIndex("by_userId_key", (q) => q.eq("userId", user._id).gte("key", args.prefix))
      .collect();
  }
});
