import { z } from "zod";

export const ChangeTypeSchema = z.enum(["added", "removed", "modified", "unchanged", "unverifiable"]);
export type ChangeType = z.infer<typeof ChangeTypeSchema>;

export const MaterialitySchema = z.enum(["critical", "high", "medium", "low", "informational"]);
export type Materiality = z.infer<typeof MaterialitySchema>;

export const IntelligenceDiffItemSchema = z.object({
  id: z.string().uuid(),
  researchCategory: z.enum(["pricing", "changelog", "news"]),
  field: z.string(), // e.g. "pricing_plans", "feature_release", "press_release"
  changeType: ChangeTypeSchema,
  materiality: MaterialitySchema,
  oldValue: z.string().nullable().optional(),
  newValue: z.string().nullable().optional(),
  evidence: z.string(), // supporting text
});

export type IntelligenceDiffItem = z.infer<typeof IntelligenceDiffItemSchema>;
