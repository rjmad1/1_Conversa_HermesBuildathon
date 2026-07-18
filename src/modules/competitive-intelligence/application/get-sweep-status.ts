import type { AppContext } from "../../app-context";
import { type IntelligenceRun } from "../domain/intelligence-run";
import { AppError, ErrorCode } from "../../../shared/errors/AppError";

export class GetSweepStatus {
  constructor(private readonly ctx: AppContext) {}

  async execute(runId: string): Promise<IntelligenceRun> {
    const tenantId = this.ctx.identity.tenantId;
    const workspaceId = this.ctx.identity.workspaceId;

    const run = await this.ctx.repos.intelligenceRun.get(tenantId, workspaceId, runId);
    if (!run) {
      throw new AppError(ErrorCode.NOT_FOUND, "Sweep run not found", 404);
    }
    return run;
  }
}
