import type { AppContext } from "../../app-context";
import { type Battlecard } from "../domain/battlecard";
import { AppError, ErrorCode } from "../../../shared/errors/AppError";

export class GetBattlecard {
  constructor(private readonly ctx: AppContext) {}

  async execute(competitorId: string): Promise<Battlecard> {
    const tenantId = this.ctx.identity.tenantId;
    const workspaceId = this.ctx.identity.workspaceId;

    const competitor = await this.ctx.repos.competitor.get(tenantId, workspaceId, competitorId);
    if (!competitor) {
      throw new AppError(ErrorCode.NOT_FOUND, "Competitor not found", 404);
    }

    const battlecard = await this.ctx.repos.battlecard.get(tenantId, workspaceId, competitorId);
    if (battlecard) {
      return battlecard;
    }

    // Return initial skeleton battlecard if no runs have succeeded yet
    return {
      tenantId,
      workspaceId,
      competitorId,
      displayName: competitor.displayName,
      pricingUrl: competitor.pricingUrl,
      changelogUrl: competitor.changelogUrl,
      newsUrl: competitor.newsUrl,
      positioning: `${competitor.displayName} is a monitored competitor. Run a sweep to build verified positioning.`,
      latestPricingFindings: "No findings yet. Run sweep.",
      latestChangelogFindings: "No findings yet. Run sweep.",
      latestNewsFindings: "No findings yet. Run sweep.",
      latestMaterialChanges: "No changes detected yet.",
      analystImplications: "Pending initial analyst synthesis.",
      sourceLinks: [],
      lastSuccessfulSweepAt: null,
      lastRunStatus: "never_run",
      lastRunId: null,
      updatedAt: competitor.updatedAt,
    };
  }
}
