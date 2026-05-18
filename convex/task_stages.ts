import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./helpers";

export const getStages = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    return await ctx.db
      .query("task_stages")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("asc")
      .collect();
  },
});

export const initializeDefaultStages = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const existing = await ctx.db
      .query("task_stages")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
    
    if (existing.length > 0) return;

    const defaults = [
      { name: "To Do", slug: "todo", color: "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]", order: 0 },
      { name: "Doing", slug: "doing", color: "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]", order: 1 },
      { name: "Done", slug: "done", color: "bg-[var(--color-success-subtle)] text-[var(--color-success)]", order: 2 },
    ];

    for (const d of defaults) {
      await ctx.db.insert("task_stages", {
        userId: user._id,
        ...d,
        createdAt: Date.now(),
      });
    }
  },
});

export const addStage = mutation({
  args: {
    token: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const slug = args.name.toLowerCase().replace(/\s+/g, '-');
    
    const lastStage = await ctx.db
      .query("task_stages")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();
    
    const order = (lastStage?.order ?? -1) + 1;

    return await ctx.db.insert("task_stages", {
      userId: user._id,
      name: args.name,
      slug,
      order,
      createdAt: Date.now(),
    });
  },
});

export const updateStage = mutation({
  args: {
    token: v.string(),
    stageId: v.id("task_stages"),
    name: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const stage = await ctx.db.get(args.stageId);
    if (!stage || stage.userId !== user._id) throw new Error("Unauthorized");

    const updates: any = {};
    if (args.name !== undefined) {
      updates.name = args.name;
      updates.slug = args.name.toLowerCase().replace(/\s+/g, '-');
    }
    if (args.order !== undefined) updates.order = args.order;

    await ctx.db.patch(args.stageId, updates);
  },
});

export const deleteStage = mutation({
  args: {
    token: v.string(),
    stageId: v.id("task_stages"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const stage = await ctx.db.get(args.stageId);
    if (!stage || stage.userId !== user._id) throw new Error("Unauthorized");
    return await ctx.db.delete(args.stageId);
  },
});
