import { z } from "zod";
import { AudioFormatSchema } from "./formats";

const ISO = z.string().datetime({ offset: true }); // RFC3339

export const TenantScopeSchema = z.object({
  tenantId: z.string().min(1),
  workspaceId: z.string().min(1),
});
export type TenantScope = z.infer<typeof TenantScopeSchema>;

export const MeetingStatusSchema = z.enum([
  "DRAFT",
  "READY",
  "PROCESSING",
  "REVIEW_REQUIRED",
  "COMPLETED",
  "FAILED",
]);
export type MeetingStatus = z.infer<typeof MeetingStatusSchema>;

export const CreateMeetingInputSchema = z.object({
  title: z.string().min(1).max(300),
  meetingType: z.string().min(1).max(80),
  scheduledAt: ISO,
});
export type CreateMeetingInput = z.infer<typeof CreateMeetingInputSchema>;

export const MeetingSchema = TenantScopeSchema.extend({
  id: z.string().uuid(),
  title: z.string(),
  meetingType: z.string(),
  status: MeetingStatusSchema,
  scheduledAt: ISO,
  createdBy: z.string(),
  createdAt: ISO,
  updatedAt: ISO,
});
export type Meeting = z.infer<typeof MeetingSchema>;

export const AudioSourceSchema = z.enum(["UPLOAD", "RECORDED", "LIVE_STREAM", "TRANSCRIPT_PASTE", "TRANSCRIPT_IMPORT"]);
export type AudioSource = z.infer<typeof AudioSourceSchema>;

export const AudioAssetStatusSchema = z.enum([
  "PENDING",
  "VALIDATING",
  "STORED",
  "TRANSCRIBING",
  "READY",
  "FAILED",
  "REJECTED",
]);
export type AudioAssetStatus = z.infer<typeof AudioAssetStatusSchema>;

export const AudioAssetSchema = TenantScopeSchema.extend({
  id: z.string().uuid(),
  meetingId: z.string().uuid(),
  source: AudioSourceSchema,
  fileName: z.string(),
  mimeType: z.string(),
  format: AudioFormatSchema,
  sizeBytes: z.number().int().nonnegative(),
  durationSeconds: z.number().nonnegative(),
  checksum: z.string(),
  storageReference: z.string(),
  status: AudioAssetStatusSchema,
  createdAt: ISO,
  updatedAt: ISO,
});
export type AudioAsset = z.infer<typeof AudioAssetSchema>;

export const TranscriptSourceSchema = z.enum(["UPLOAD", "PASTE", "IMPORT", "TRANSCRIPTION"]);
export type TranscriptSource = z.infer<typeof TranscriptSourceSchema>;

export const TranscriptSchema = TenantScopeSchema.extend({
  id: z.string().uuid(),
  meetingId: z.string().uuid(),
  source: TranscriptSourceSchema,
  language: z.string().min(2).max(8),
  content: z.string(),
  segments: z.array(
    z.object({
      speaker: z.string().nullable(),
      startMs: z.number().nonnegative(),
      endMs: z.number().nonnegative(),
      text: z.string(),
    }),
  ),
  status: z.enum(["PENDING", "VALIDATING", "READY", "FAILED"]),
  createdAt: ISO,
  updatedAt: ISO,
});
export type Transcript = z.infer<typeof TranscriptSchema>;

export const AnalysisRunStatusSchema = z.enum([
  "PENDING",
  "RUNNING",
  "COMPLETED",
  "FAILED",
]);
export type AnalysisRunStatus = z.infer<typeof AnalysisRunStatusSchema>;

export const AnalysisRunSchema = TenantScopeSchema.extend({
  id: z.string().uuid(),
  meetingId: z.string().uuid(),
  transcriptId: z.string().uuid(),
  provider: z.string(),
  model: z.string(),
  status: AnalysisRunStatusSchema,
  idempotencyKey: z.string(),
  startedAt: ISO,
  completedAt: ISO.nullable(),
  latencyMs: z.number().int().nonnegative().nullable(),
  tokenUsage: z.object({ input: z.number().int().nonnegative(), output: z.number().int().nonnegative() }).nullable(),
  errorCode: z.string().nullable(),
});
export type AnalysisRun = z.infer<typeof AnalysisRunSchema>;

export const DecisionSchema = z.object({
  id: z.string().uuid(),
  meetingId: z.string().uuid(),
  description: z.string().min(1),
  rationale: z.string(),
  sourceEvidence: z.string().min(1),
  confidence: z.number().min(0).max(1),
  createdAt: ISO,
});
export type Decision = z.infer<typeof DecisionSchema>;

export const ActionStatusSchema = z.enum([
  "PROPOSED",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "EXECUTION_PENDING",
  "EXECUTED",
  "EXECUTION_FAILED",
]);
export type ActionStatus = z.infer<typeof ActionStatusSchema>;

export const ProposedActionSchema = z.object({
  id: z.string().uuid(),
  meetingId: z.string().uuid(),
  description: z.string().min(1),
  ownerName: z.string().nullable(),
  ownerReference: z.string().nullable(),
  dueDate: ISO.nullable(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  targetSystem: z.string(),
  actionType: z.string(),
  rationale: z.string(),
  sourceEvidence: z.string().min(1),
  confidence: z.number().min(0).max(1),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  status: ActionStatusSchema,
  createdAt: ISO,
  updatedAt: ISO,
});
export type ProposedAction = z.infer<typeof ProposedActionSchema>;

export const MeetingAnalysisSchema = z.object({
  id: z.string().uuid(),
  meetingId: z.string().uuid(),
  summary: z.string(),
  topics: z.array(z.string()),
  decisions: z.array(DecisionSchema),
  proposedActions: z.array(ProposedActionSchema),
  risks: z.array(z.string()),
  createdAt: ISO,
});
export type MeetingAnalysis = z.infer<typeof MeetingAnalysisSchema>;

export const ApprovalDecisionSchema = z.object({
  id: z.string().uuid(),
  actionId: z.string().uuid(),
  decision: z.enum(["APPROVED", "REJECTED"]),
  actorId: z.string(),
  reason: z.string().nullable(),
  createdAt: ISO,
});
export type ApprovalDecision = z.infer<typeof ApprovalDecisionSchema>;

export const AuditEventSchema = TenantScopeSchema.extend({
  id: z.string().uuid(),
  meetingId: z.string().uuid(),
  entityType: z.string(),
  entityId: z.string().uuid(),
  eventType: z.string(),
  actorType: z.string(),
  actorId: z.string(),
  correlationId: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: ISO,
  hash: z.string().optional(),
  previousHash: z.string().optional(),
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

// Provider result contracts (normalized; no provider types leak into domain)
export const TranscriptResultSchema = z.object({
  language: z.string(),
  content: z.string(),
  segments: z.array(
    z.object({
      speaker: z.string().nullable(),
      startMs: z.number().nonnegative(),
      endMs: z.number().nonnegative(),
      text: z.string(),
    }),
  ),
});
export type TranscriptResult = z.infer<typeof TranscriptResultSchema>;
