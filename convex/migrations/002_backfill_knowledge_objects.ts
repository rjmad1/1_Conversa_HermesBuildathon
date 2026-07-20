import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const backfillKnowledgeObjects = internalMutation({
  args: {
    tenantId: v.string(),
    workspaceId: v.string(),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("knowledge_objects")
      .withIndex("by_tenant_workspace", (q) =>
        q.eq("tenantId", args.tenantId).eq("workspaceId", args.workspaceId)
      )
      .collect();

    let updatedCount = 0;

    for (const doc of records) {
      let needsUpdate = false;
      const metadata = doc.metadata || {};

      if (!metadata.schemaVersion || !metadata.objectTypeVersion) {
        metadata.schemaVersion = 1;
        metadata.objectTypeVersion = 1;
        metadata.migratedAt = Date.now();
        needsUpdate = true;
      }

      if (needsUpdate) {
        await ctx.db.patch(doc._id, {
          metadata,
          updatedAt: Date.now(),
        });
        updatedCount++;
      }
    }

    return { total: records.length, updated: updatedCount };
  },
});
