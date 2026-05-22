import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper to authenticate
const authenticate = async (ctx: any, token: string) => {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .unique();
  if (!session) throw new Error("Invalid session");
  return session.userId;
};

export const getStaff = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const userId = await authenticate(ctx, args.token);
    return await ctx.db
      .query("staff")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const createStaff = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    color: v.optional(v.string()),
    platform: v.optional(v.string()),
    pages: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await authenticate(ctx, args.token);
    
    const staffId = await ctx.db.insert("staff", {
      userId,
      name: args.name,
      avatarUrl: args.avatarUrl,
      color: args.color,
      platform: args.platform,
      pages: args.pages,
      createdAt: Date.now(),
    });
    
    return staffId;
  },
});

export const deleteStaff = mutation({
  args: {
    token: v.string(),
    staffId: v.id("staff"),
  },
  handler: async (ctx, args) => {
    const userId = await authenticate(ctx, args.token);
    const staffMember = await ctx.db.get(args.staffId);
    
    if (!staffMember) throw new Error("Staff member not found");
    if (staffMember.userId !== userId) throw new Error("Unauthorized");
    
    await ctx.db.delete(args.staffId);
  },
});

export const updateStaff = mutation({
  args: {
    token: v.string(),
    staffId: v.id("staff"),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    color: v.optional(v.string()),
    platform: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await authenticate(ctx, args.token);
    const staffMember = await ctx.db.get(args.staffId);
    
    if (!staffMember) throw new Error("Staff member not found");
    if (staffMember.userId !== userId) throw new Error("Unauthorized");
    
    await ctx.db.patch(args.staffId, {
      name: args.name,
      avatarUrl: args.avatarUrl,
      color: args.color,
      platform: args.platform,
    });
  },
});
