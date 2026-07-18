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
