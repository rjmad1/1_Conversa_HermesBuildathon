import { z } from "zod";

export const KnowledgeObjectTypeEnum = z.enum([
  "Workspace",
  "Collection",
  "Meeting",
  "Task",
  "Decision",
  "Person",
  "Project",
  "Document",
  "Reference",
  "Template",
  "Attachment",
  "Conversation",
  "Prompt",
  "View",
]);

export const VisibilityLevelEnum = z.enum(["Private", "Workspace", "Public"]);

export const RelationshipLinkSchema = z.object({
  targetId: z.string(),
  relationType: z.string(),
});

// Specialized property schemas
export const MeetingPropertiesSchema = z.object({
  meetingType: z.string().default("general"),
  scheduledAt: z.string().optional(),
  durationSeconds: z.number().optional(),
  attendees: z.array(z.string()).default([]),
  audioAssetId: z.string().optional(),
  transcriptId: z.string().optional(),
});

export const TaskPropertiesSchema = z.object({
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  assigneeId: z.string().optional(),
  completedAt: z.string().optional(),
});

export const DecisionPropertiesSchema = z.object({
  context: z.string().optional(),
  alternatives: z.array(z.string()).default([]),
  impactArea: z.string().optional(),
  decidedBy: z.string().optional(),
});

export const PersonPropertiesSchema = z.object({
  email: z.string().email().optional(),
  role: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export const DocumentPropertiesSchema = z.object({
  format: z.string().default("markdown"),
  wordCount: z.number().optional(),
});

// Canonical Knowledge Object Schema
export const KnowledgeObjectSchema = z.object({
  id: z.string(),
  type: KnowledgeObjectTypeEnum,
  tenantId: z.string(),
  workspaceId: z.string(),
  title: z.string().min(1),
  summary: z.string().optional(),
  body: z.string().optional(),
  properties: z.record(z.any()).default({}),
  metadata: z.record(z.any()).default({}),
  labels: z.array(z.string()).default([]),
  relationships: z.array(RelationshipLinkSchema).default([]),
  source: z.string().optional(),
  createdBy: z.string(),
  updatedBy: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  status: z.string().default("active"),
  visibility: VisibilityLevelEnum.default("Workspace"),
  aiContext: z.record(z.any()).optional(),
  executionMetadata: z.record(z.any()).optional(),
  version: z.number().default(1),
});

export type KnowledgeObjectInput = z.infer<typeof KnowledgeObjectSchema>;
