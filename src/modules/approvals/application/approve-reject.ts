import { randomUUID } from "node:crypto";
import type { AppContext } from "../../app-context";
import { auditMeta } from "../../app-context";
import { AppError, ErrorCode } from "../../../shared/errors/AppError";
import { logger } from "../../../shared/logging/logger";

export class ApproveProposedAction {
  constructor(private readonly ctx: AppContext) {}
  async execute(actionId: string, correlationId: string): Promise<void> {
    const action = await this.ctx.repos.meetingAnalysis.getAction(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, actionId);
    if (!action) throw new AppError(ErrorCode.NOT_FOUND, "Action not found", 404);
    if (action.status !== "PROPOSED") throw new AppError(ErrorCode.INVALID_STATE_TRANSITION, "Only PROPOSED actions can be approved", 409, { received: action.status });

    action.status = "APPROVED";
    action.updatedAt = new Date().toISOString();
    await this.ctx.repos.meetingAnalysis.updateAction(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, action);
    await this.ctx.audit.record({
      ...auditMeta(this.ctx, action.meetingId, correlationId),
      entityType: "PROPOSED_ACTION",
      entityId: actionId,
      eventType: "ACTION_APPROVED",
      metadata: { description: action.description },
    });
    logger.info({ operation: "ApproveProposedAction", correlationId, outcome: "success" }, "action approved");
  }
}

export class RejectProposedAction {
  constructor(private readonly ctx: AppContext) {}
  async execute(actionId: string, reason: string, correlationId: string): Promise<void> {
    const action = await this.ctx.repos.meetingAnalysis.getAction(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, actionId);
    if (!action) throw new AppError(ErrorCode.NOT_FOUND, "Action not found", 404);

    if (!reason || reason.trim().length === 0) throw new AppError(ErrorCode.REJECTION_REASON_REQUIRED, "Rejection requires a reason", 400);
    if (action.status !== "PROPOSED") throw new AppError(ErrorCode.INVALID_STATE_TRANSITION, "Only PROPOSED actions can be rejected", 409, { received: action.status });

    action.status = "REJECTED";
    action.updatedAt = new Date().toISOString();
    await this.ctx.repos.meetingAnalysis.updateAction(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, action);
    await this.ctx.repos.meetingAnalysis.saveApproval(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, {
      id: randomUUID(),
      actionId,
      decision: "REJECTED",
      actorId: this.ctx.identity.actorId,
      reason: reason.trim(),
      createdAt: new Date().toISOString(),
    });
    await this.ctx.audit.record({
      ...auditMeta(this.ctx, action.meetingId, correlationId),
      entityType: "PROPOSED_ACTION",
      entityId: actionId,
      eventType: "ACTION_REJECTED",
      metadata: { reason: reason.trim() },
    });
    logger.info({ operation: "RejectProposedAction", correlationId, outcome: "success" }, "action rejected");
  }
}
