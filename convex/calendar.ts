import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./helpers";

export const getEvents = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    return await ctx.db
      .query("calendar_events")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const createEvent = mutation({
  args: {
    token: v.string(),
    title: v.string(),
    type: v.string(),
    startAt: v.number(),
    endAt: v.optional(v.number()),
    allDay: v.optional(v.boolean()),
    clientId: v.optional(v.id("clients")),
    projectId: v.optional(v.id("projects")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    return await ctx.db.insert("calendar_events", {
      userId: user._id,
      title: args.title,
      type: args.type,
      startAt: args.startAt,
      endAt: args.endAt,
      allDay: args.allDay,
      clientId: args.clientId,
      projectId: args.projectId,
      notes: args.notes,
      createdAt: Date.now(),
    });
  },
});

// Mutation to update only the status of an event
export const updateEventStatus = mutation({
  args: {
    token: v.string(),
    eventId: v.id("calendar_events"),
    status: v.string(), // 'pending' | 'done' | 'cancelled'
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== user._id) throw new Error("Unauthorized");

    return await ctx.db.patch(args.eventId, { status: args.status });
  },
});

export const updateEvent = mutation({
  args: {
    token: v.string(),
    eventId: v.id("calendar_events"),
    title: v.optional(v.string()),
    type: v.optional(v.string()),
    startAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== user._id) throw new Error("Unauthorized");

    const updates: any = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.type !== undefined) updates.type = args.type;
    if (args.startAt !== undefined) updates.startAt = args.startAt;
    if (args.notes !== undefined) updates.notes = args.notes;

    return await ctx.db.patch(args.eventId, updates);
  },
});

export const deleteEvent = mutation({
  args: {
    token: v.string(),
    eventId: v.id("calendar_events"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== user._id) throw new Error("Unauthorized");

    return await ctx.db.delete(args.eventId);
  },
});
