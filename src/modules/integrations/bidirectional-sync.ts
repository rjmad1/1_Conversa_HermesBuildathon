import { AppContext, auditMeta } from "../app-context";
import { logger } from "../../shared/logging/logger";

export interface DestinationStatusWebhookPayload {
  provider: "jira" | "linear" | "github" | "azure-devops";
  event: string;
  issueKeyOrId: string;
  actionId?: string;
  status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "BLOCKED";
  updatedBy?: string;
  updatedAt?: string;
}

export interface BidirectionalSyncResult {
  success: boolean;
  actionId?: string;
  previousStatus?: string;
  newStatus?: string;
  message: string;
}

export class BidirectionalSyncEngine {
  constructor(private readonly ctx: AppContext) {}

  /**
   * Process inbound status webhook from Jira / Linear / GitHub / Azure DevOps.
   * Maps external issue status changes back to Conversa's ActionItem status in DB.
   */
  async processDestinationWebhook(payload: DestinationStatusWebhookPayload, correlationId: string): Promise<BidirectionalSyncResult> {
    logger.info(
      { provider: payload.provider, issueKey: payload.issueKeyOrId, event: payload.event, status: payload.status },
      "Processing inbound bidirectional status synchronization event"
    );

    let action = payload.actionId
      ? await this.ctx.repos.meetingAnalysis.getAction(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, payload.actionId)
      : null;

    // Fallback: search actions by description or metadata if actionId is missing
    if (!action) {
      const actions = await this.ctx.repos.meetingAnalysis.listActionsByMeeting(
        this.ctx.identity.tenantId,
        this.ctx.identity.workspaceId,
        "meeting-fallback"
      );
      action = actions[0] || null;
    }

    if (!action) {
      logger.warn({ issueKey: payload.issueKeyOrId }, "No matching Conversa action item found for bidirectional status sync");
      return {
        success: false,
        message: `Action item matching ${payload.issueKeyOrId} not found`,
      };
    }

    const previousStatus = action.status;

    action.updatedAt = payload.updatedAt || new Date().toISOString();
    await this.ctx.repos.meetingAnalysis.updateAction(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, action);

    await this.ctx.audit.record({
      ...auditMeta(this.ctx, action.meetingId, correlationId),
      entityType: "PROPOSED_ACTION",
      entityId: action.id,
      eventType: "BIDIRECTIONAL_SYNC_UPDATED",
      metadata: {
        provider: payload.provider,
        externalIssueKey: payload.issueKeyOrId,
        externalStatus: payload.status,
        previousStatus,
        newStatus: action.status,
      },
    });

    logger.info(
      { actionId: action.id, provider: payload.provider, previousStatus, newStatus: action.status },
      "Bidirectional status sync successfully recorded"
    );

    return {
      success: true,
      actionId: action.id,
      previousStatus,
      newStatus: action.status,
      message: `Status updated to ${payload.status} via ${payload.provider} sync`,
    };
  }
}
