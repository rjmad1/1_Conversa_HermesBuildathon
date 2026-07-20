import { query } from "../_generated/server";
import { v } from "convex/values";

export const run012VerifyGraphParity = query({
  args: {
    tenantId: v.string(),
    workspaceId: v.string(),
  },
  handler: async (ctx, args) => {
    const objects = await ctx.db
      .query("knowledge_objects")
      .withIndex("by_tenant_workspace", (q) =>
        q.eq("tenantId", args.tenantId).eq("workspaceId", args.workspaceId)
      )
      .collect();

    const graphEdges = await ctx.db
      .query("graph_edges")
      .withIndex("by_tenant_workspace", (q) =>
        q.eq("tenantId", args.tenantId).eq("workspaceId", args.workspaceId)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    let legacyCount = 0;
    const missingInGraphEdges: Array<{ sourceId: string; targetId: string; relationType: string }> = [];

    for (const obj of objects) {
      if (!obj.relationships || !Array.isArray(obj.relationships)) continue;
      for (const rel of obj.relationships) {
        if (!rel.targetId || !rel.relationType) continue;
        legacyCount++;

        const found = graphEdges.some(
          (e) => e.sourceId === obj.id && e.targetId === rel.targetId && e.relationType === rel.relationType
        );

        if (!found) {
          missingInGraphEdges.push({
            sourceId: obj.id,
            targetId: rel.targetId,
            relationType: rel.relationType,
          });
        }
      }
    }

    const parityOk = legacyCount === graphEdges.length && missingInGraphEdges.length === 0;

    return {
      parityOk,
      legacyRelationshipCount: legacyCount,
      graphEdgeCount: graphEdges.length,
      missingInGraphEdgesCount: missingInGraphEdges.length,
      missingInGraphEdges: missingInGraphEdges.slice(0, 10),
    };
  },
});
