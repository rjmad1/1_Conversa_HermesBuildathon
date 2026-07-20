import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getViewDefinition = query({
  args: {
    tenantId: v.string(),
    workspaceId: v.string(),
    viewId: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("view_definitions")
      .withIndex("by_id", (q) => q.eq("id", args.viewId))
      .first();
  },
});

export const listWorkspaceViews = query({
  args: {
    tenantId: v.string(),
    workspaceId: v.string(),
    objectTypeId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const views = await ctx.db
      .query("view_definitions")
      .withIndex("by_tenant_workspace", (q) =>
        q.eq("tenantId", args.tenantId).eq("workspaceId", args.workspaceId)
      )
      .collect();

    if (args.objectTypeId) {
      return views.filter(
        (v) =>
          v.objectTypeId === args.objectTypeId ||
          (v.objectTypes && v.objectTypes.includes(args.objectTypeId!))
      );
    }
    return views;
  },
});

export const saveViewDefinition = mutation({
  args: {
    tenantId: v.string(),
    workspaceId: v.string(),
    view: v.any(),
  },
  handler: async (ctx, args) => {
    const { view } = args;
    const existing = await ctx.db
      .query("view_definitions")
      .withIndex("by_id", (q) => q.eq("id", view.id))
      .first();

    const doc = {
      ...view,
      tenantId: args.tenantId,
      workspaceId: args.workspaceId,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.replace(existing._id, doc);
    } else {
      await ctx.db.insert("view_definitions", {
        ...doc,
        createdAt: doc.createdAt || Date.now(),
      });
    }

    return view.id;
  },
});

export const deleteViewDefinition = mutation({
  args: {
    tenantId: v.string(),
    workspaceId: v.string(),
    viewId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("view_definitions")
      .withIndex("by_id", (q) => q.eq("id", args.viewId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const getViewOverride = query({
  args: {
    tenantId: v.string(),
    workspaceId: v.string(),
    parentViewId: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.userId) {
      return ctx.db
        .query("view_overrides")
        .withIndex("by_user_parent", (q) =>
          q
            .eq("tenantId", args.tenantId)
            .eq("workspaceId", args.workspaceId)
            .eq("userId", args.userId)
            .eq("parentViewId", args.parentViewId)
        )
        .first();
    }

    return ctx.db
      .query("view_overrides")
      .withIndex("by_parent_view", (q) =>
        q
          .eq("tenantId", args.tenantId)
          .eq("workspaceId", args.workspaceId)
          .eq("parentViewId", args.parentViewId)
      )
      .filter((q) => q.eq(q.field("userId"), undefined))
      .first();
  },
});

export const saveViewOverride = mutation({
  args: {
    tenantId: v.string(),
    workspaceId: v.string(),
    override: v.any(),
  },
  handler: async (ctx, args) => {
    const { override } = args;
    const existing = await ctx.db
      .query("view_overrides")
      .withIndex("by_id", (q) => q.eq("id", override.id))
      .first();

    const doc = {
      ...override,
      tenantId: args.tenantId,
      workspaceId: args.workspaceId,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.replace(existing._id, doc);
    } else {
      await ctx.db.insert("view_overrides", {
        ...doc,
        createdAt: doc.createdAt || Date.now(),
      });
    }

    return override.id;
  },
});

export const deleteViewOverride = mutation({
  args: {
    tenantId: v.string(),
    workspaceId: v.string(),
    overrideId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("view_overrides")
      .withIndex("by_id", (q) => q.eq("id", args.overrideId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
