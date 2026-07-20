import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";

// --- Object Types Queries & Mutations ---
export const saveObjectType = internalMutation({
  args: {
    objectType: v.object({
      id: v.string(),
      tenantId: v.string(),
      workspaceId: v.string(),
      name: v.string(),
      icon: v.string(),
      color: v.string(),
      description: v.optional(v.string()),
      parentTypeId: v.optional(v.string()),
      fieldDefinitions: v.array(v.string()),
      defaultViewId: v.optional(v.string()),
      supportedViewIds: v.array(v.string()),
      defaultActionIds: v.array(v.string()),
      validationRules: v.any(),
      systemType: v.boolean(),
      isExtensible: v.boolean(),
      version: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("object_types")
      .withIndex("by_id", (q) => q.eq("id", args.objectType.id))
      .first();

    if (existing) {
      await ctx.db.replace(existing._id, args.objectType);
    } else {
      await ctx.db.insert("object_types", args.objectType);
    }
  },
});

export const listObjectTypes = query({
  args: {
    tenantId: v.string(),
    workspaceId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("object_types")
      .withIndex("by_tenant_workspace", (q) =>
        q.eq("tenantId", args.tenantId).eq("workspaceId", args.workspaceId)
      )
      .collect();
  },
});

// --- Field Definitions Queries & Mutations ---
export const saveFieldDefinition = internalMutation({
  args: {
    field: v.object({
      id: v.string(),
      tenantId: v.string(),
      workspaceId: v.string(),
      key: v.string(),
      name: v.string(),
      type: v.string(),
      required: v.boolean(),
      defaultValue: v.optional(v.any()),
      constraints: v.optional(v.any()),
      validation: v.optional(v.any()),
      description: v.optional(v.string()),
      displayOptions: v.optional(v.any()),
      searchable: v.boolean(),
      filterable: v.boolean(),
      sortable: v.boolean(),
      aiVisible: v.boolean(),
      editable: v.boolean(),
      hidden: v.boolean(),
      version: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("field_definitions")
      .withIndex("by_id", (q) => q.eq("id", args.field.id))
      .first();

    if (existing) {
      await ctx.db.replace(existing._id, args.field);
    } else {
      await ctx.db.insert("field_definitions", args.field);
    }
  },
});

export const listFieldDefinitions = query({
  args: {
    tenantId: v.string(),
    workspaceId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("field_definitions")
      .withIndex("by_tenant_workspace", (q) =>
        q.eq("tenantId", args.tenantId).eq("workspaceId", args.workspaceId)
      )
      .collect();
  },
});
