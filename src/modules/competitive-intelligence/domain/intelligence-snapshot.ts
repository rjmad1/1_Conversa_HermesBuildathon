import { z } from "zod";

export const IntelligenceSnapshotSchema = z.object({
  id: z.string().uuid(),
  competitorId: z.string().uuid(),
  runId: z.string().uuid(),
  researchCategory: z.enum(["pricing", "changelog", "news"]),
  sourceUrl: z.string().url(),
  retrievedAt: z.string(),
  normalizedFindings: z.string(),
  contentFingerprint: z.string(),
  rawSourceExtract: z.string(),
  previousSnapshotId: z.string().nullable().optional(),
  tenantId: z.string(),
  workspaceId: z.string(),
});

export type IntelligenceSnapshot = z.infer<typeof IntelligenceSnapshotSchema>;
