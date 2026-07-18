import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  meetings: defineTable({
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
  }).index("by_tenant_workspace", ["tenantId", "workspaceId"])
    .index("by_id", ["id"]),

  transcripts: defineTable({
    id: v.string(),
    tenantId: v.string(),
    workspaceId: v.string(),
    meetingId: v.string(),
    source: v.string(),
    language: v.string(),
    content: v.string(),
    segments: v.array(v.object({
      speaker: v.union(v.string(), v.null()),
      startMs: v.number(),
      endMs: v.number(),
      text: v.string(),
    })),
    status: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_meeting", ["meetingId"])
    .index("by_id", ["id"]),

  audio_assets: defineTable({
    id: v.string(),
    tenantId: v.string(),
    workspaceId: v.string(),
    meetingId: v.string(),
    source: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
    format: v.object({
      codec: v.string(),
      channels: v.number(),
      sampleRate: v.number(),
      bitrate: v.optional(v.number()),
    }),
    sizeBytes: v.number(),
    durationSeconds: v.number(),
    checksum: v.string(),
    storageReference: v.string(),
    status: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_meeting", ["meetingId"])
    .index("by_checksum", ["tenantId", "workspaceId", "meetingId", "checksum"])
    .index("by_id", ["id"]),

  waitlist: defineTable({
    id: v.string(),
    tenantId: v.string(),
    workspaceId: v.string(),
    email: v.string(),
    createdAt: v.string(),
    source: v.union(v.string(), v.null()),
    campaign: v.union(v.string(), v.null()),
    consent: v.boolean(),
  }).index("by_email", ["tenantId", "workspaceId", "email"]),
});
