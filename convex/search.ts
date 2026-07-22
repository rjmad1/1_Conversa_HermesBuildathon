import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Perform keyword and field matching across knowledge_objects in a workspace.
 */
export const searchKnowledgeObjects = query({
  args: {
    tenantId: v.string(),
    workspaceId: v.string(),
    keywords: v.optional(v.array(v.string())),
    objectTypes: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    let items = await ctx.db
      .query("knowledge_objects")
      .withIndex("by_tenant_workspace", (q) =>
        q.eq("tenantId", args.tenantId).eq("workspaceId", args.workspaceId)
      )
      .collect();

    if (args.objectTypes && args.objectTypes.length > 0) {
      items = items.filter((item) => args.objectTypes!.includes(item.type));
    }

    if (args.keywords && args.keywords.length > 0) {
      const kw = args.keywords.map((k) => k.toLowerCase());
      items = items.filter((item) => {
        const text = `${item.title} ${item.summary || ""} ${item.body || ""} ${item.labels.join(" ")}`.toLowerCase();
        return kw.some((k) => text.includes(k));
      });
    }

    return items.slice(0, limit);
  },
});

/**
 * Perform paginated search across knowledge_objects in a workspace using cursor-based pagination.
 */
export const searchKnowledgeObjectsPaginated = query({
  args: {
    tenantId: v.string(),
    workspaceId: v.string(),
    keywords: v.optional(v.array(v.string())),
    objectTypes: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()), // Stringified numeric offset or token
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const offset = args.cursor ? parseInt(args.cursor, 10) : 0;

    let items = await ctx.db
      .query("knowledge_objects")
      .withIndex("by_tenant_workspace", (q) =>
        q.eq("tenantId", args.tenantId).eq("workspaceId", args.workspaceId)
      )
      .collect();

    if (args.objectTypes && args.objectTypes.length > 0) {
      items = items.filter((item) => args.objectTypes!.includes(item.type));
    }

    if (args.keywords && args.keywords.length > 0) {
      const kw = args.keywords.map((k) => k.toLowerCase());
      items = items.filter((item) => {
        const text = `${item.title} ${item.summary || ""} ${item.body || ""} ${item.labels.join(" ")}`.toLowerCase();
        return kw.some((k) => text.includes(k));
      });
    }

    const totalCount = items.length;
    const pageItems = items.slice(offset, offset + limit);
    const hasMore = offset + limit < totalCount;
    const nextCursor = hasMore ? String(offset + limit) : null;

    return {
      items: pageItems,
      totalCount,
      limit,
      cursor: args.cursor ?? "0",
      nextCursor,
      hasMore,
    };
  },
});

/**
 * Get saved searches for a workspace and optionally a user.
 */
export const getSavedSearches = query({
  args: {
    tenantId: v.string(),
    workspaceId: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("saved_searches")
      .withIndex("by_tenant_workspace", (q) =>
        q.eq("tenantId", args.tenantId).eq("workspaceId", args.workspaceId)
      )
      .collect();

    return list.filter(
      (s) =>
        s.scope === "system" ||
        s.scope === "workspace" ||
        s.scope === "organization" ||
        (s.userId && s.userId === args.userId)
    );
  },
});

/**
 * Save or update a search definition.
 */
export const createOrUpdateSavedSearch = mutation({
  args: {
    id: v.string(),
    tenantId: v.string(),
    workspaceId: v.string(),
    userId: v.optional(v.string()),
    name: v.string(),
    description: v.optional(v.string()),
    queryAST: v.any(),
    rankingProfile: v.optional(v.string()),
    contextProfile: v.optional(v.string()),
    defaultViewId: v.optional(v.string()),
    scope: v.string(),
    isFavorite: v.boolean(),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("saved_searches")
      .withIndex("by_id", (q) => q.eq("id", args.id))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        description: args.description,
        queryAST: args.queryAST,
        rankingProfile: args.rankingProfile,
        contextProfile: args.contextProfile,
        defaultViewId: args.defaultViewId,
        scope: args.scope,
        isFavorite: args.isFavorite,
        category: args.category,
        tags: args.tags,
        version: (existing.version || 1) + 1,
        updatedAt: now,
      });
      return existing.id;
    } else {
      await ctx.db.insert("saved_searches", {
        id: args.id,
        tenantId: args.tenantId,
        workspaceId: args.workspaceId,
        userId: args.userId,
        name: args.name,
        description: args.description,
        queryAST: args.queryAST,
        rankingProfile: args.rankingProfile,
        contextProfile: args.contextProfile,
        defaultViewId: args.defaultViewId,
        scope: args.scope,
        isFavorite: args.isFavorite,
        usageCount: 0,
        category: args.category,
        tags: args.tags,
        version: 1,
        createdAt: now,
        updatedAt: now,
      });
      return args.id;
    }
  },
});

/**
 * Seed system default saved searches if not present.
 */
export const seedDefaultSavedSearches = mutation({
  args: {
    tenantId: v.string(),
    workspaceId: v.string(),
  },
  handler: async (ctx, args) => {
    const defaults = [
      {
        id: "sys_search_my_tasks",
        name: "My Tasks",
        description: "All open tasks assigned to me",
        scope: "system",
        category: "Tasks",
        isFavorite: true,
        queryAST: {
          version: 1,
          objectTypes: ["task"],
          predicate: {
            type: "logical",
            operator: "AND",
            expressions: [
              { type: "property", fieldKey: "status", operator: "neq", value: "completed" },
            ],
          },
        },
      },
      {
        id: "sys_search_recent_meetings",
        name: "Recent Meetings",
        description: "Meetings scheduled or conducted recently",
        scope: "system",
        category: "Meetings",
        isFavorite: true,
        queryAST: {
          version: 1,
          objectTypes: ["meeting"],
          sort: [{ field: "createdAt", direction: "desc" }],
        },
      },
      {
        id: "sys_search_todays_work",
        name: "Today's Work",
        description: "Knowledge items updated today",
        scope: "system",
        category: "Work",
        isFavorite: true,
        queryAST: {
          version: 1,
          predicate: {
            type: "date",
            fieldKey: "updatedAt",
            operator: "today",
          },
        },
      },
      {
        id: "sys_search_open_decisions",
        name: "Open Decisions",
        description: "Pending architectural or business decisions",
        scope: "system",
        category: "Decisions",
        isFavorite: false,
        queryAST: {
          version: 1,
          objectTypes: ["decision"],
          predicate: {
            type: "property",
            fieldKey: "status",
            operator: "eq",
            value: "open",
          },
        },
      },
      {
        id: "sys_search_recently_updated",
        name: "Recently Updated",
        description: "Items updated in the last 7 days",
        scope: "system",
        category: "General",
        isFavorite: false,
        queryAST: {
          version: 1,
          predicate: {
            type: "date",
            fieldKey: "updatedAt",
            operator: "last_n_days",
            value: { days: 7 },
          },
          sort: [{ field: "updatedAt", direction: "desc" }],
        },
      },
      {
        id: "sys_search_all_knowledge",
        name: "All Knowledge",
        description: "Unfiltered workspace knowledge catalog",
        scope: "system",
        category: "General",
        isFavorite: false,
        queryAST: {
          version: 1,
        },
      },
    ];

    const now = Date.now();
    for (const def of defaults) {
      const existing = await ctx.db
        .query("saved_searches")
        .withIndex("by_id", (q) => q.eq("id", def.id))
        .first();

      if (!existing) {
        await ctx.db.insert("saved_searches", {
          id: def.id,
          tenantId: args.tenantId,
          workspaceId: args.workspaceId,
          name: def.name,
          description: def.description,
          queryAST: def.queryAST,
          scope: def.scope,
          isFavorite: def.isFavorite,
          usageCount: 0,
          category: def.category,
          version: 1,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    return true;
  },
});
