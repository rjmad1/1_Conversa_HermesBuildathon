import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const createGraphEdge = mutation({
  args: {
    id: v.string(),
    tenantId: v.string(),
    workspaceId: v.string(),
    sourceId: v.string(),
    targetId: v.string(),
    relationType: v.string(),
    metadata: v.optional(v.any()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if active edge already exists
    const existing = await ctx.db
      .query("graph_edges")
      .withIndex("by_pair", (q) =>
        q
          .eq("tenantId", args.tenantId)
          .eq("workspaceId", args.workspaceId)
          .eq("sourceId", args.sourceId)
          .eq("targetId", args.targetId)
          .eq("relationType", args.relationType)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (existing) {
      return existing;
    }

    const now = Date.now();
    const doc = {
      id: args.id,
      tenantId: args.tenantId,
      workspaceId: args.workspaceId,
      sourceId: args.sourceId,
      targetId: args.targetId,
      relationType: args.relationType,
      metadata: args.metadata,
      createdBy: args.createdBy,
      updatedBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
      version: 1,
      status: "active",
    };

    await ctx.db.insert("graph_edges", doc);
    return doc;
  },
});

export const updateGraphEdge = mutation({
  args: {
    id: v.string(),
    tenantId: v.string(),
    workspaceId: v.string(),
    metadata: v.optional(v.any()),
    status: v.optional(v.string()),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("graph_edges")
      .withIndex("by_id", (q) => q.eq("id", args.id))
      .first();

    if (!existing) return null;

    const patch: Record<string, any> = {
      updatedBy: args.updatedBy,
      updatedAt: Date.now(),
      version: existing.version + 1,
    };

    if (args.metadata !== undefined) {
      patch.metadata = { ...(existing.metadata || {}), ...args.metadata };
    }
    if (args.status !== undefined) {
      patch.status = args.status;
    }

    await ctx.db.patch(existing._id, patch);
    return { ...existing, ...patch };
  },
});

export const findGraphEdges = query({
  args: {
    tenantId: v.string(),
    workspaceId: v.string(),
    sourceId: v.optional(v.string()),
    targetId: v.optional(v.string()),
    relationType: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const statusFilter = args.status || "active";

    if (args.sourceId) {
      let q = ctx.db
        .query("graph_edges")
        .withIndex("by_source", (q) =>
          q
            .eq("tenantId", args.tenantId)
            .eq("workspaceId", args.workspaceId)
            .eq("sourceId", args.sourceId!)
        );
      if (args.relationType) {
        q = q.filter((q) => q.eq(q.field("relationType"), args.relationType));
      }
      const list = await q.filter((q) => q.eq(q.field("status"), statusFilter)).collect();
      return list;
    }

    if (args.targetId) {
      let q = ctx.db
        .query("graph_edges")
        .withIndex("by_target", (q) =>
          q
            .eq("tenantId", args.tenantId)
            .eq("workspaceId", args.workspaceId)
            .eq("targetId", args.targetId!)
        );
      if (args.relationType) {
        q = q.filter((q) => q.eq(q.field("relationType"), args.relationType));
      }
      const list = await q.filter((q) => q.eq(q.field("status"), statusFilter)).collect();
      return list;
    }

    if (args.relationType) {
      const list = await ctx.db
        .query("graph_edges")
        .withIndex("by_relation_type", (q) =>
          q
            .eq("tenantId", args.tenantId)
            .eq("workspaceId", args.workspaceId)
            .eq("relationType", args.relationType!)
        )
        .filter((q) => q.eq(q.field("status"), statusFilter))
        .collect();
      return list;
    }

    const list = await ctx.db
      .query("graph_edges")
      .withIndex("by_tenant_workspace", (q) =>
        q.eq("tenantId", args.tenantId).eq("workspaceId", args.workspaceId)
      )
      .filter((q) => q.eq(q.field("status"), statusFilter))
      .collect();

    return list;
  },
});

export const getNeighbors = query({
  args: {
    tenantId: v.string(),
    workspaceId: v.string(),
    nodeId: v.string(),
    direction: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const dir = args.direction || "both";
    let outgoing: any[] = [];
    let incoming: any[] = [];

    if (dir === "outgoing" || dir === "both") {
      outgoing = await ctx.db
        .query("graph_edges")
        .withIndex("by_source", (q) =>
          q
            .eq("tenantId", args.tenantId)
            .eq("workspaceId", args.workspaceId)
            .eq("sourceId", args.nodeId)
        )
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();
    }

    if (dir === "incoming" || dir === "both") {
      incoming = await ctx.db
        .query("graph_edges")
        .withIndex("by_target", (q) =>
          q
            .eq("tenantId", args.tenantId)
            .eq("workspaceId", args.workspaceId)
            .eq("targetId", args.nodeId)
        )
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();
    }

    return [...outgoing, ...incoming];
  },
});
