import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const recordMigration = internalMutation({
  args: {
    migrationId: v.string(),
    name: v.string(),
    status: v.string(),
    details: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("workspace_metadata")
      .withIndex("by_id", (q) => q.eq("id", `migration_${args.migrationId}`))
      .first();

    const record = {
      id: `migration_${args.migrationId}`,
      tenantId: "system",
      workspaceId: "system",
      installedPlugins: [args.name],
      settings: {
        status: args.status,
        details: args.details || {},
        executedAt: Date.now(),
      },
      version: 1,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.replace(existing._id, record);
    } else {
      await ctx.db.insert("workspace_metadata", record);
    }
  },
});

export const isMigrationExecuted = internalQuery({
  args: { migrationId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("workspace_metadata")
      .withIndex("by_id", (q) => q.eq("id", `migration_${args.migrationId}`))
      .first();
    return existing ? existing.settings?.status === "completed" : false;
  },
});
