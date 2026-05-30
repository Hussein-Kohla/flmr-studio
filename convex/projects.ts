import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, logAction, toCents } from "./helpers";
import { paginationOptsValidator } from "convex/server";

export const getProjects = query({
  args: { 
    token: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    return await ctx.db
      .query("projects")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const createProject = mutation({
  args: {
    token: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    clientId: v.id("clients"),
    status: v.optional(v.string()),
    deadline: v.optional(v.number()),
    startDate: v.optional(v.number()),
    budget: v.optional(v.number()),
    revenue: v.optional(v.number()),
    projectType: v.optional(v.string()),
    platform: v.optional(v.string()),
    color: v.optional(v.string()),
    priority: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    assignedTo: v.optional(v.string()),
    steps: v.optional(v.array(v.object({
      id: v.string(),
      title: v.string(),
      isCompleted: v.boolean(),
      assignedTo: v.optional(v.string()),
      deadline: v.optional(v.number()),
      description: v.optional(v.string()),
      subtasks: v.optional(v.array(v.object({
        id: v.string(),
        title: v.string(),
        isCompleted: v.boolean(),
      }))),
    }))),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const now = Date.now();
    
    const projectId = await ctx.db.insert("projects", {
      userId: user._id,
      title: args.title,
      description: args.description,
      clientId: args.clientId,
      status: args.status || "draft",
      deadline: args.deadline,
      budgetCents: args.budget !== undefined ? toCents(args.budget) : undefined,
      revenueCents: args.revenue !== undefined ? toCents(args.revenue) : undefined,
      startDate: args.startDate,
      projectType: args.projectType,
      platform: args.platform,
      color: args.color,
      priority: args.priority || 'medium',
      tags: args.tags || [],
      assignedTo: args.assignedTo,
      steps: args.steps || [],
      createdAt: now,
      updatedAt: now,
    });

    await logAction(ctx, user._id, "CREATE_PROJECT", "projects", projectId, { title: args.title });
    return projectId;
  },
});

export const updateProjectStatus = mutation({
  args: {
    token: v.string(),
    projectId: v.id("projects"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== user._id) throw new Error("Unauthorized");
    
    await ctx.db.patch(args.projectId, { 
      status: args.status,
      updatedAt: Date.now()
    });

    await logAction(ctx, user._id, "UPDATE_PROJECT_STATUS", "projects", args.projectId, { status: args.status });
  },
});

export const updateProject = mutation({
  args: {
    token: v.string(),
    projectId: v.id("projects"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    deadline: v.optional(v.number()),
    startDate: v.optional(v.number()),
    budget: v.optional(v.number()),
    revenue: v.optional(v.number()),
    projectType: v.optional(v.string()),
    platform: v.optional(v.string()),
    color: v.optional(v.string()),
    priority: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    assignedTo: v.optional(v.string()),
    clientId: v.optional(v.id("clients")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== user._id) throw new Error("Unauthorized");

    const updates: any = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.status !== undefined) updates.status = args.status;
    if (args.deadline !== undefined) updates.deadline = args.deadline;
    if (args.startDate !== undefined) updates.startDate = args.startDate;
    if (args.budget !== undefined) updates.budgetCents = toCents(args.budget);
    if (args.revenue !== undefined) updates.revenueCents = toCents(args.revenue);
    if (args.projectType !== undefined) updates.projectType = args.projectType;
    if (args.platform !== undefined) updates.platform = args.platform;
    if (args.color !== undefined) updates.color = args.color;
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.assignedTo !== undefined) updates.assignedTo = args.assignedTo;
    if (args.clientId !== undefined) updates.clientId = args.clientId;

    await ctx.db.patch(args.projectId, updates);
    await logAction(ctx, user._id, "UPDATE_PROJECT", "projects", args.projectId, updates);
  },
});

export const deleteProject = mutation({
  args: {
    token: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== user._id) throw new Error("Unauthorized");
    
    // Optimized Cascade Delete: Using by_projectId index
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .collect();
    
    for (const task of tasks) await ctx.db.delete(task._id);

    // Deleting project should ideally NOT delete payments/transactions 
    // to maintain financial history, but we should clear the project reference.
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .collect();
    
    for (const payment of payments) {
      await ctx.db.patch(payment._id, { projectId: undefined });
    }

    await ctx.db.delete(args.projectId);
    await logAction(ctx, user._id, "DELETE_PROJECT", "projects", args.projectId, { title: project.title });
  },
});

export const updateProjectSteps = mutation({
  args: {
    token: v.string(),
    projectId: v.id("projects"),
    steps: v.array(v.object({
      id: v.string(),
      title: v.string(),
      isCompleted: v.boolean(),
      assignedTo: v.optional(v.string()),
      deadline: v.optional(v.number()),
      description: v.optional(v.string()),
      subtasks: v.optional(v.array(v.object({
        id: v.string(),
        title: v.string(),
        isCompleted: v.boolean(),
      }))),
    })),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== user._id) throw new Error("Unauthorized");

    await ctx.db.patch(args.projectId, {
      steps: args.steps,
      updatedAt: Date.now(),
    });
  },
});

export const getAllProjects = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    return await ctx.db
      .query("projects")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

