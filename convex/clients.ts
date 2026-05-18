import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, logAction } from "./helpers";
import { paginationOptsValidator } from "convex/server";
import { ClientStatus, LifecycleStage } from "./domain/constants";
import { AuditService } from "./services/events";

export const getClients = query({
  args: {
    token: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const clientsPage = await ctx.db
      .query("clients")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);

    // Patch revenue on the fly for old records (UI only)
    const enrichedPage = await Promise.all(clientsPage.page.map(async (client) => {
      if (client.revenueCents !== undefined) return client;

      const txs = await ctx.db
        .query("transactions")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();

      const revenue = txs
        .filter(t => t.clientId === client._id && t.type === 'income' && (t.status === 'posted' || t.status === 'paid'))
        .reduce((sum, t) => sum + (t.amountCents || 0), 0);

      return { ...client, revenueCents: revenue };
    }));

    return { ...clientsPage, page: enrichedPage };
  },
});

export const createClient = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const now = Date.now();

    const clientId = await ctx.db.insert("clients", {
      userId: user._id,
      name: args.name,
      email: args.email,
      phone: args.phone,
      company: args.company,
      avatarUrl: args.avatarUrl,
      tags: args.tags,
      status: ClientStatus.LEAD,
      lifecycle_stage: LifecycleStage.DISCOVERY,
      balanceCents: 0,
      revenueCents: 0,
      createdAt: now,
      updatedAt: now,
    });

    await AuditService.log(ctx, user._id, "CREATE_CLIENT", "clients", clientId, null, { name: args.name });
    return clientId;
  },
});

export const updateClient = mutation({
  args: {
    token: v.string(),
    clientId: v.id("clients"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    address: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    subscription: v.optional(v.object({
      amountCents: v.number(),
      dueDay: v.number(),
      paidMonths: v.array(v.number()),
      monthAmounts: v.optional(v.array(v.object({
        month: v.number(),
        amountCents: v.number(),
      }))),
    })),
    notes: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    avatarId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const client = await ctx.db.get(args.clientId);
    if (!client || client.userId !== user._id) throw new Error("Unauthorized");

    const { token, clientId, ...updates } = args;
    const patchData: any = {
      ...updates,
      updatedAt: Date.now()
    };

    if (args.avatarId) {
      const url = await ctx.storage.getUrl(args.avatarId);
      if (url) patchData.avatarUrl = url;
    }

    await ctx.db.patch(args.clientId, patchData);
    await logAction(ctx, user._id, "UPDATE_CLIENT", "clients", args.clientId, updates);
    return args.clientId;
  },
});

export const deleteClient = mutation({
  args: {
    token: v.string(),
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const client = await ctx.db.get(args.clientId);
    if (!client || client.userId !== user._id) throw new Error("Unauthorized");

    // CASCADE DELETE: Using specialized indexes
    // 1. Projects
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    for (const project of projects) {
      // Tasks for project
      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_projectId", (q) => q.eq("projectId", project._id))
        .collect();
      for (const task of tasks) await ctx.db.delete(task._id);

      await ctx.db.delete(project._id);
    }

    // 2. Payments & Transactions
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    for (const payment of payments) {
      const txs = await ctx.db
        .query("transactions")
        .withIndex("by_referenceId", (q) => q.eq("referenceId", payment._id))
        .collect();
      for (const tx of txs) await ctx.db.delete(tx._id);
      await ctx.db.delete(payment._id);
    }

    // 3. Invoices
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
    for (const inv of invoices) await ctx.db.delete(inv._id);

    await ctx.db.delete(args.clientId);
    await logAction(ctx, user._id, "DELETE_CLIENT_CASCADE", "clients", args.clientId, { name: client.name });
  },
});

export const generateUploadUrl = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.token);
    return await ctx.storage.generateUploadUrl();
  },
});

export const migrateRevenue = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    for (const client of clients) {
      const transactions = await ctx.db
        .query("transactions")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();

      const clientTxs = transactions.filter(t =>
        t.clientId === client._id &&
        t.type === 'income' &&
        (t.status === 'posted' || t.status === 'paid')
      );

      const totalRevenue = clientTxs.reduce((sum, tx) => sum + (tx.amountCents || 0), 0);

      await ctx.db.patch(client._id, {
        revenueCents: totalRevenue
      });
    }
    return { success: true, count: clients.length };
  }
});
