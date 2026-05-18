import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, logAction } from "./helpers";
import { paginationOptsValidator } from "convex/server";

export const getTasks = query({
  args: { 
    token: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    return await ctx.db
      .query("tasks")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const createTask = mutation({
  args: {
    token: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    priority: v.string(),
    dueDate: v.optional(v.number()),
    clientId: v.optional(v.id("clients")),
    projectId: v.optional(v.id("projects")),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const { token, ...taskData } = args;
    const taskId = await ctx.db.insert("tasks", {
      ...taskData,
      userId: user._id,
      createdAt: Date.now(),
    });
    
    await logAction(ctx, user._id, "CREATE_TASK", "tasks", taskId, { title: args.title });
    return taskId;
  },
});

export const updateTask = mutation({
  args: {
    token: v.string(),
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const { token, taskId, ...updates } = args;
    await ctx.db.patch(taskId, updates);
    await logAction(ctx, user._id, "UPDATE_TASK", "tasks", taskId, updates);
  },
});

export const deleteTask = mutation({
  args: {
    token: v.string(),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== user._id) throw new Error("Unauthorized");
    
    await ctx.db.delete(args.taskId);
    await logAction(ctx, user._id, "DELETE_TASK", "tasks", args.taskId, { title: task.title });
  },
});
