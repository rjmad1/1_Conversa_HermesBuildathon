import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const run010CreateGraphEdges = mutation({
  args: {
    tenantId: v.string(),
    workspaceId: v.string(),
  },
  handler: async (ctx, args) => {
    // Record migration execution in workspace_metadata or system status
    const meta = await ctx.db
      .query("workspace_metadata")
      .withIndex("by_tenant_workspace", (q) =>
        q.eq("tenantId", args.tenantId).eq("workspaceId", args.workspaceId)
      )
      .first();

    const now = Date.now();
    const settings = meta?.settings || {};
    const executedMigrations: string[] = settings.executedMigrations || [];

    if (!executedMigrations.includes("010_create_graph_edges")) {
      executedMigrations.push("010_create_graph_edges");
      if (meta) {
        await ctx.db.patch(meta._id, {
          settings: { ...settings, executedMigrations },
          updatedAt: now,
        });
      }
    }

    return { status: "completed", migration: "010_create_graph_edges" };
  },
});
