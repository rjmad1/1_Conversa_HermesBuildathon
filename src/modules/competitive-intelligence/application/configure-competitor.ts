import { randomUUID } from "node:crypto";
import type { AppContext } from "../../app-context";
import { CompetitorSchema, type Competitor } from "../domain/competitor";
import { AppError, ErrorCode } from "../../../shared/errors/AppError";

export class ConfigureCompetitor {
  constructor(private readonly ctx: AppContext) {}

  async execute(input: {
    id?: string;
    displayName: string;
    pricingUrl: string;
    changelogUrl: string;
    newsUrl: string;
    searchTerms?: string[];
    isActive?: boolean;
  }): Promise<Competitor> {
    const tenantId = this.ctx.identity.tenantId;
    const workspaceId = this.ctx.identity.workspaceId;

    const id = input.id || randomUUID();
    const now = new Date().toISOString();

    const competitorRepo = this.ctx.repos.competitor;

    const existing = await competitorRepo.get(tenantId, workspaceId, id);

    const competitor: Competitor = {
      tenantId,
      workspaceId,
      id,
      displayName: input.displayName,
      pricingUrl: input.pricingUrl,
      changelogUrl: input.changelogUrl,
      newsUrl: input.newsUrl,
      searchTerms: input.searchTerms || [],
      isActive: input.isActive !== false,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    // Validate using Zod schema
    const parsed = CompetitorSchema.safeParse(competitor);
    if (!parsed.success) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Invalid competitor configuration: " + parsed.error.message,
        400
      );
    }

    await competitorRepo.save(competitor);

    await this.ctx.audit.record({
      tenantId,
      workspaceId,
      actorId: this.ctx.identity.actorId || "anonymous",
      actorType: this.ctx.identity.actorType || "user",
      meetingId: "intelligence",
      correlationId: randomUUID(),
      entityType: "COMPETITOR",
      entityId: id,
      eventType: existing ? "COMPETITOR_UPDATED" : "COMPETITOR_CREATED",
      metadata: { displayName: competitor.displayName },
    });

    return competitor;
  }
}
