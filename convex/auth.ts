import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, hashPassword, generateSalt, generateSecureToken } from "./helpers";

export const signup = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existing) throw new Error("User already exists");

    const salt = generateSalt();
    const passwordHash = await hashPassword(args.password, salt);

    const userId = await ctx.db.insert("users", {
      email: args.email,
      passwordHash,
      passwordSalt: salt,
      name: args.name,
      role: "owner",
      createdAt: Date.now(),
    });

    const token = generateSecureToken();
    await ctx.db.insert("sessions", {
      userId,
      token,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
      createdAt: Date.now(),
    });

    // 3. Initialize Chart of Accounts (Domain Logic)
    const chartOfAccounts = [
      { name: "Cash", code: "1000", type: "asset" },
      { name: "Accounts Receivable", code: "1200", type: "asset" },
      { name: "Revenue", code: "4000", type: "revenue" },
      { name: "Expenses", code: "5000", type: "expense" },
    ];

    for (const account of chartOfAccounts) {
      await ctx.db.insert("ledger_accounts", {
        ...account,
        userId,
      });
    }

    // 4. Create default pipeline stages
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
        userId,
        createdAt: Date.now(),
      });
    }

    return { token };
  },
});

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user || !user.passwordSalt || !user.passwordHash) {
      throw new Error("USER_NOT_FOUND");
    }

    const hash = await hashPassword(args.password, user.passwordSalt);
    if (hash !== user.passwordHash) {
      throw new Error("INVALID_PASSWORD");
    }

    const token = generateSecureToken();
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
      createdAt: Date.now(),
    });

    return { token };
  },
});

export const getMe = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    try {
      return await requireUser(ctx, args.token);
    } catch (e) {
      return null;
    }
  },
});
