import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const run011BackfillGraphEdges = mutation({
  args: {
    tenantId: v.string(),
    workspaceId: v.string(),
  },
  handler: async (ctx, args) => {
    // Read all knowledge_objects for workspace
    const objects = await ctx.db
      .query("knowledge_objects")
      .withIndex("by_tenant_workspace", (q) =>
        q.eq("tenantId", args.tenantId).eq("workspaceId", args.workspaceId)
      )
      .collect();

    let edgesCreated = 0;
    let edgesSkipped = 0;
    const now = Date.now();

    for (const obj of objects) {
      if (!obj.relationships || !Array.isArray(obj.relationships)) continue;

      for (const rel of obj.relationships) {
        if (!rel.targetId || !rel.relationType) continue;

        // Check if edge already exists in graph_edges
        const existing = await ctx.db
          .query("graph_edges")
          .withIndex("by_pair", (q) =>
            q
              .eq("tenantId", args.tenantId)
              .eq("workspaceId", args.workspaceId)
              .eq("sourceId", obj.id)
              .eq("targetId", rel.targetId)
              .eq("relationType", rel.relationType)
          )
          .filter((q) => q.eq(q.field("status"), "active"))
          .first();

        if (existing) {
          edgesSkipped++;
          continue;
        }

        const edgeId = `edge_mig_${now}_${Math.random().toString(36).substring(2, 9)}`;
        await ctx.db.insert("graph_edges", {
          id: edgeId,
          tenantId: args.tenantId,
          workspaceId: args.workspaceId,
          sourceId: obj.id,
          targetId: rel.targetId,
          relationType: rel.relationType,
          metadata: { migratedFromLegacyArray: true },
          createdBy: obj.createdBy || "system_migration",
          updatedBy: obj.updatedBy || "system_migration",
          createdAt: now,
          updatedAt: now,
          version: 1,
          status: "active",
        });

        edgesCreated++;
      }
    }

    return {
      status: "completed",
      migration: "011_backfill_graph_edges",
      processedObjects: objects.length,
      edgesCreated,
      edgesSkipped,
    };
  },
});
