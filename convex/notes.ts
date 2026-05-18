import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./helpers";

export const getNotes = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    return await ctx.db
      .query("notes")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("asc")
      .collect();
  },
});

export const createNote = mutation({
  args: {
    token: v.string(),
    clientId: v.optional(v.id("clients")),
    projectId: v.optional(v.id("projects")),
    content: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const now = Date.now();
    return await ctx.db.insert("notes", {
      userId: user._id,
      clientId: args.clientId,
      projectId: args.projectId,
      content: args.content,
      color: args.color,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateNote = mutation({
  args: {
    token: v.string(),
    noteId: v.id("notes"),
    content: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== user._id) throw new Error("Unauthorized");
    
    return await ctx.db.patch(args.noteId, {
      content: args.content !== undefined ? args.content : note.content,
      color: args.color !== undefined ? args.color : note.color,
      updatedAt: Date.now(),
    });
  },
});

export const deleteNote = mutation({
  args: {
    token: v.string(),
    noteId: v.id("notes"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== user._id) throw new Error("Unauthorized");
    
    await ctx.db.delete(args.noteId);
  },
});
