import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./helpers";

export const getStages = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    return await ctx.db
      .query("pipeline_stages")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const addStage = mutation({
  args: {
    token: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);

    const stages = await ctx.db
      .query("pipeline_stages")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const slug = args.name.toLowerCase().replace(/\s+/g, '_');
    
    return await ctx.db.insert("pipeline_stages", {
      name: args.name,
      slug,
      order: stages.length,
      userId: user._id,
      createdAt: Date.now(),
    });
  },
});

export const updateStage = mutation({
  args: {
    token: v.string(),
    stageId: v.id("pipeline_stages"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const stage = await ctx.db.get(args.stageId);
    if (!stage || stage.userId !== user._id) throw new Error("Unauthorized");

    await ctx.db.patch(args.stageId, { name: args.name });
  },
});

export const deleteStage = mutation({
  args: {
    token: v.string(),
    stageId: v.id("pipeline_stages"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const stage = await ctx.db.get(args.stageId);
    if (!stage || stage.userId !== user._id) throw new Error("Unauthorized");

    // Check if any projects are in this stage (by slug)
    const projectsInStage = await ctx.db
      .query("projects")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), stage.slug))
      .first();

    if (projectsInStage) {
      throw new Error("Cannot delete stage because it contains projects. Move the projects first.");
    }

    await ctx.db.delete(args.stageId);
  },
});

export const initializeDefaultStages = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);

    const existing = await ctx.db
      .query("pipeline_stages")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    if (existing.length > 0) return; // Already has stages

    const defaultStages = [
      { name: 'Draft', slug: 'draft', order: 0 },
      { name: 'In Review', slug: 'in_review', order: 1 },
      { name: 'Revision', slug: 'revision', order: 2 },
      { name: 'Approved', slug: 'approved', order: 3 },
      { name: 'Completed', slug: 'done', order: 4 },
    ];

    for (const stage of defaultStages) {
      await ctx.db.insert("pipeline_stages", {
        ...stage,
        userId: user._id,
        createdAt: Date.now(),
      });
    }
  },
});
