import { AppContext, auditMeta } from "../../app-context";
import { AppError, ErrorCode } from "../../../shared/errors/AppError";
import { logger } from "../../../shared/logging/logger";
import { ProductAnalyticsTracker } from "../../../shared/analytics/tracker";
import { HandOffDispatcher } from "../../integrations/hand-off-dispatcher";

export interface AutoDispatchOptions {
  confidenceThreshold?: number; // Default 0.95 (95% confidence)
  defaultDestination?: "jira" | "linear" | "github" | "azure-devops" | "slack";
}

export interface AutoDispatchResult {
  actionId: string;
  autoDispatched: boolean;
  confidenceScore: number;
  threshold: number;
  dispatchResult?: any;
  reason?: string;
}

export class ConfidenceAutoDispatchEngine {
  private readonly threshold: number;

  constructor(private readonly ctx: AppContext, options: AutoDispatchOptions = {}) {
    this.threshold = options.confidenceThreshold ?? 0.95;
  }

  /**
   * Evaluate a proposed action item's multi-agent confidence score.
   * If confidence >= threshold, auto-approve and dispatch to target destination app.
   */
  async evaluateAndDispatch(actionId: string, options: { destination?: string; correlationId?: string } = {}): Promise<AutoDispatchResult> {
    const correlationId = options.correlationId || `auto-dispatch-${Date.now()}`;
    const action = await this.ctx.repos.meetingAnalysis.getAction(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, actionId);

    if (!action) {
      throw new AppError(ErrorCode.NOT_FOUND, "Action not found", 404);
    }

    if (action.status !== "PROPOSED") {
      return {
        actionId,
        autoDispatched: false,
        confidenceScore: action.confidence ?? 0.8,
        threshold: this.threshold,
        reason: `Action status is ${action.status}, not PROPOSED`,
      };
    }

    const confidenceScore = action.confidence ?? 0.85;

    // Check if confidence meets or exceeds auto-dispatch threshold
    if (confidenceScore < this.threshold) {
      logger.info(
        { actionId, confidenceScore, threshold: this.threshold },
        "Confidence score below auto-dispatch threshold; retaining in Human-in-the-Loop review queue"
      );
      return {
        actionId,
        autoDispatched: false,
        confidenceScore,
        threshold: this.threshold,
        reason: `Confidence ${confidenceScore} below threshold ${this.threshold}`,
      };
    }

    // Auto-approve action
    action.status = "APPROVED";
    action.updatedAt = new Date().toISOString();
    await this.ctx.repos.meetingAnalysis.updateAction(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, action);

    ProductAnalyticsTracker.trackApproval(
      this.ctx.identity.tenantId,
      this.ctx.identity.workspaceId,
      "system-auto-dispatch",
      actionId
    );

    await this.ctx.audit.record({
      ...auditMeta(this.ctx, action.meetingId, correlationId),
      entityType: "PROPOSED_ACTION",
      entityId: actionId,
      eventType: "ACTION_AUTO_DISPATCHED",
      metadata: {
        confidenceScore,
        threshold: this.threshold,
        description: action.description,
      },
    });

    // Execute Hand-Off Dispatch
    const destination = (options.destination || "jira") as "jira" | "linear" | "github" | "azure-devops" | "slack";
    const dispatcher = new HandOffDispatcher();
    const dispatchResult = await dispatcher.dispatch(destination, {
      id: actionId,
      title: action.description.substring(0, 60),
      description: `Auto-Dispatched Action Item (Confidence: ${(confidenceScore * 100).toFixed(1)}%)\n\n${action.description}`,
      ownerName: action.ownerName,
      dueDate: action.dueDate,
    });

    logger.info(
      { actionId, destination, confidenceScore, outcome: "success" },
      "Action item successfully auto-approved and dispatched"
    );

    return {
      actionId,
      autoDispatched: true,
      confidenceScore,
      threshold: this.threshold,
      dispatchResult,
    };
  }
}
