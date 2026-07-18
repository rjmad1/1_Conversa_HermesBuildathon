import { z } from "zod";
import { TenantScopeSchema } from "../../../shared/validation/schemas";
import { ResearchFindingSchema } from "./research-finding";
import { IntelligenceDiffItemSchema } from "./intelligence-diff";

export const SweepStatusSchema = z.enum([
  "queued",
  "researching",
  "diffing",
  "analysing",
  "validating",
  "delivering",
  "completed",
  "completed_with_warnings",
  "failed",
]);
export type SweepStatus = z.infer<typeof SweepStatusSchema>;

export const AnalystSynthesisSchema = z.object({
  whatChanged: z.string(),
  whyItMatters: z.string(),
  marketImpact: z.string(),
  recommendedResponse: z.string(),
  confidence: z.number().min(0).max(1),
  sources: z.array(z.string().url()),
});
export type AnalystSynthesis = z.infer<typeof AnalystSynthesisSchema>;

export const QAChecksSchema = z.object({
  passed: z.boolean(),
  claimsSourced: z.boolean(),
  correctCompetitor: z.boolean(),
  urlsValid: z.boolean(),
  changesExistInDiff: z.boolean(),
  noEvidenceMix: z.boolean(),
  noCrossTenantData: z.boolean(),
  errors: z.array(z.string()).default([]),
});
export type QAChecks = z.infer<typeof QAChecksSchema>;

export const IntelligenceRunSchema = TenantScopeSchema.extend({
  runId: z.string().uuid(),
  competitorId: z.string().uuid(),
  triggerType: z.enum(["manual", "scheduled"]),
  startedAt: z.string(),
  completedAt: z.string().nullable(),
  status: SweepStatusSchema,
  findings: z.array(ResearchFindingSchema).default([]),
  sourceUrls: z.array(z.string().url()).default([]),
  previousSnapshotIds: z.record(z.string(), z.string()).default({}), // researchCategory -> snapshotId
  diffs: z.array(IntelligenceDiffItemSchema).default([]),
  analystOutput: AnalystSynthesisSchema.nullable().optional(),
  qaChecks: QAChecksSchema.nullable().optional(),
  revisionHistory: z.array(z.object({
    attempt: z.number(),
    feedback: z.string(),
    analystOutput: AnalystSynthesisSchema,
    qaChecks: QAChecksSchema,
    timestamp: z.string(),
  })).default([]),
  slackDeliveryResult: z.object({
    delivered: z.boolean(),
    timestamp: z.string().nullable().optional(),
    error: z.string().nullable().optional(),
  }).nullable().optional(),
  errorCode: z.string().nullable().optional(),
  errorDetails: z.string().nullable().optional(),
  correlationId: z.string(),
  modelName: z.string().optional(),
  tokenUsage: z.object({
    input: z.number(),
    output: z.number(),
  }).optional(),
});

export type IntelligenceRun = z.infer<typeof IntelligenceRunSchema>;
