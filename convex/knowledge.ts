import { internalMutation, internalQuery, query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const save = internalMutation({
  args: {
    object: v.object({
      id: v.string(),
      type: v.string(),
      tenantId: v.string(),
      workspaceId: v.string(),
      title: v.string(),
      summary: v.optional(v.string()),
      body: v.optional(v.string()),
      properties: v.any(),
      metadata: v.any(),
      labels: v.array(v.string()),
      relationships: v.array(v.object({
        targetId: v.string(),
        relationType: v.string(),
      })),
      source: v.optional(v.string()),
      createdBy: v.string(),
      updatedBy: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
      status: v.string(),
      visibility: v.string(),
      aiContext: v.optional(v.any()),
      executionMetadata: v.optional(v.any()),
      version: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("knowledge_objects")
      .withIndex("by_id", (q) => q.eq("id", args.object.id))
      .first();

    if (existing) {
      await ctx.db.replace(existing._id, args.object);
    } else {
      await ctx.db.insert("knowledge_objects", args.object);
    }
  },
});

export const getById = internalQuery({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("knowledge_objects")
      .withIndex("by_id", (q) => q.eq("id", args.id))
      .first();
  },
});

export const listByWorkspace = query({
  args: {
    tenantId: v.string(),
    workspaceId: v.string(),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.type) {
      return await ctx.db
        .query("knowledge_objects")
        .withIndex("by_type", (q) =>
          q
            .eq("tenantId", args.tenantId)
            .eq("workspaceId", args.workspaceId)
            .eq("type", args.type!)
        )
        .collect();
    }
    return await ctx.db
      .query("knowledge_objects")
      .withIndex("by_tenant_workspace", (q) =>
        q.eq("tenantId", args.tenantId).eq("workspaceId", args.workspaceId)
      )
      .collect();
  },
});

export const upsertPublic = mutation({
  args: {
    object: v.object({
      id: v.string(),
      type: v.string(),
      tenantId: v.string(),
      workspaceId: v.string(),
      title: v.string(),
      summary: v.optional(v.string()),
      body: v.optional(v.string()),
      properties: v.any(),
      metadata: v.any(),
      labels: v.array(v.string()),
      relationships: v.array(v.object({
        targetId: v.string(),
        relationType: v.string(),
      })),
      source: v.optional(v.string()),
      createdBy: v.string(),
      updatedBy: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
      status: v.string(),
      visibility: v.string(),
      aiContext: v.optional(v.any()),
      executionMetadata: v.optional(v.any()),
      version: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("knowledge_objects")
      .withIndex("by_id", (q) => q.eq("id", args.object.id))
      .first();

    if (existing) {
      await ctx.db.replace(existing._id, args.object);
    } else {
      await ctx.db.insert("knowledge_objects", args.object);
    }
  },
});
