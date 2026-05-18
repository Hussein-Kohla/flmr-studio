import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./helpers";

export const getQueue = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    return await ctx.db
      .query("publishing_queue")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const schedulePost = mutation({
  args: {
    token: v.string(),
    title: v.string(),
    platform: v.string(),
    publishDate: v.optional(v.number()),
    clientId: v.optional(v.id("clients")),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    return await ctx.db.insert("publishing_queue", {
      userId: user._id,
      title: args.title,
      platform: args.platform,
      status: "scheduled",
      publishDate: args.publishDate,
      clientId: args.clientId,
      projectId: args.projectId,
      createdAt: Date.now(),
    });
  },
});
export const deletePost = mutation({
  args: {
    token: v.string(),
    postId: v.id("publishing_queue"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const post = await ctx.db.get(args.postId);
    if (!post || post.userId !== user._id) throw new Error("Unauthorized");
    await ctx.db.delete(args.postId);
  },
});
