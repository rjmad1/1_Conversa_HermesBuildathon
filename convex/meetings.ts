import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const save = internalMutation({
  args: {
    meeting: v.object({
      id: v.string(),
      tenantId: v.string(),
      workspaceId: v.string(),
      title: v.string(),
      meetingType: v.string(),
      status: v.string(),
      scheduledAt: v.string(),
      createdBy: v.string(),
      createdAt: v.string(),
      updatedAt: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("meetings")
      .withIndex("by_id", (q) => q.eq("id", args.meeting.id))
      .first();
    
    if (existing) {
      await ctx.db.replace(existing._id, args.meeting);
    } else {
      await ctx.db.insert("meetings", args.meeting);
    }

    // Dual-write to canonical knowledge_objects table
    const existingKo = await ctx.db
      .query("knowledge_objects")
      .withIndex("by_id", (q) => q.eq("id", args.meeting.id))
      .first();

    const canonicalKo = {
      id: args.meeting.id,
      type: "Meeting",
      tenantId: args.meeting.tenantId,
      workspaceId: args.meeting.workspaceId,
      title: args.meeting.title,
      summary: "",
      body: "",
      properties: {
        meetingType: args.meeting.meetingType,
        scheduledAt: args.meeting.scheduledAt,
      },
      metadata: {},
      labels: ["meeting"],
      relationships: [],
      createdBy: args.meeting.createdBy,
      updatedBy: args.meeting.createdBy,
      createdAt: new Date(args.meeting.createdAt).getTime() || Date.now(),
      updatedAt: new Date(args.meeting.updatedAt).getTime() || Date.now(),
      status: args.meeting.status,
      visibility: "Workspace",
      version: 1,
    };

    if (existingKo) {
      await ctx.db.replace(existingKo._id, canonicalKo);
    } else {
      await ctx.db.insert("knowledge_objects", canonicalKo);
    }
  },
});

export const get = internalQuery({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("meetings")
      .withIndex("by_id", (q) => q.eq("id", args.id))
      .first();
  },
});
