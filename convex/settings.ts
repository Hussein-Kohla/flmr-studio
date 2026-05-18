import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./helpers";

export const getSettings = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    return await ctx.db
      .query("settings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
  },
});

export const updateSettings = mutation({
  args: {
    token: v.string(),
    theme: v.optional(v.string()),
    studioName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    const updates = {
      theme: args.theme,
      studioName: args.studioName,
      contactEmail: args.contactEmail,
      website: args.website,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, updates);
    } else {
      await ctx.db.insert("settings", {
        userId: user._id,
        ...updates,
      });
    }
  },
});
