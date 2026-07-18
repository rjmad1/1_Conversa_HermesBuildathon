import { z } from "zod";
import { TenantScopeSchema } from "../../../shared/validation/schemas";

export const CompetitorSchema = TenantScopeSchema.extend({
  id: z.string().uuid(),
  displayName: z.string().min(1),
  pricingUrl: z.string().url(),
  changelogUrl: z.string().url(),
  newsUrl: z.string().url(),
  searchTerms: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  createdAt: z.string(), // ISO string
  updatedAt: z.string(), // ISO string
});

export type Competitor = z.infer<typeof CompetitorSchema>;
