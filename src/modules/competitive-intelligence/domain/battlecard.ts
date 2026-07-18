import { z } from "zod";
import { TenantScopeSchema } from "../../../shared/validation/schemas";

export const BattlecardSchema = TenantScopeSchema.extend({
  competitorId: z.string().uuid(),
  displayName: z.string(),
  pricingUrl: z.string().url(),
  changelogUrl: z.string().url(),
  newsUrl: z.string().url(),
  positioning: z.string(), // e.g. "current verified positioning"
  latestPricingFindings: z.string(),
  latestChangelogFindings: z.string(),
  latestNewsFindings: z.string(),
  latestMaterialChanges: z.string(), // summary of material changes
  analystImplications: z.string(),
  sourceLinks: z.array(z.object({ title: z.string(), url: z.string().url() })),
  lastSuccessfulSweepAt: z.string().nullable(),
  lastRunStatus: z.string(),
  lastRunId: z.string().uuid().nullable(),
  updatedAt: z.string(),
});

export type Battlecard = z.infer<typeof BattlecardSchema>;
