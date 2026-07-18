import type { AppContext } from "../../app-context";
import { type IntelligenceRun } from "../domain/intelligence-run";
import { AppError, ErrorCode } from "../../../shared/errors/AppError";

export class ListRunLogs {
  constructor(private readonly ctx: AppContext) {}

  async execute(competitorId: string): Promise<IntelligenceRun[]> {
    const tenantId = this.ctx.identity.tenantId;
    const workspaceId = this.ctx.identity.workspaceId;

    const competitor = await this.ctx.repos.competitor.get(tenantId, workspaceId, competitorId);
    if (!competitor) {
      throw new AppError(ErrorCode.NOT_FOUND, "Competitor not found", 404);
    }

    return this.ctx.repos.intelligenceRun.list(tenantId, workspaceId, competitorId);
  }
}
