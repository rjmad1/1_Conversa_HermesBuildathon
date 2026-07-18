import { z } from "zod";

export const ResearchCategorySchema = z.enum(["pricing", "changelog", "news"]);
export type ResearchCategory = z.infer<typeof ResearchCategorySchema>;

export const ResearchFindingSchema = z.object({
  researchCategory: ResearchCategorySchema,
  sourceUrl: z.string().url(),
  pageTitle: z.string(),
  retrievedAt: z.string(), // ISO string
  extractedFindings: z.string(), // extracted factual findings
  evidenceExcerpt: z.string(), // relevant text excerpt / normalized evidence
  contentFingerprint: z.string(), // content hash/fingerprint
  confidence: z.number().min(0).max(1),
  status: z.enum(["success", "failed"]),
  errorDetails: z.string().nullable().optional(),
  provider: z.string(), // Research provider used (e.g. "linkup", "fixture")
});

export type ResearchFinding = z.infer<typeof ResearchFindingSchema>;
