import { logger } from "../logging/logger";

export interface AnalyticsEvent {
  tenantId: string;
  workspaceId: string;
  userId: string;
  eventType: "APPROVAL" | "REJECTION" | "OVERRIDE";
  actionId: string;
  metadata: Record<string, any>;
  timestamp: string;
}

export class ProductAnalyticsTracker {
  private static events: AnalyticsEvent[] = [];

  static trackApproval(tenantId: string, workspaceId: string, userId: string, actionId: string): void {
    const event: AnalyticsEvent = {
      tenantId,
      workspaceId,
      userId,
      eventType: "APPROVAL",
      actionId,
      metadata: {},
      timestamp: new Date().toISOString(),
    };
    this.events.push(event);
    logger.info({ event }, "Product Analytics: User Approved Proposed Action");
  }

  static trackRejection(tenantId: string, workspaceId: string, userId: string, actionId: string, reason: string): void {
    const event: AnalyticsEvent = {
      tenantId,
      workspaceId,
      userId,
      eventType: "REJECTION",
      actionId,
      metadata: { reason },
      timestamp: new Date().toISOString(),
    };
    this.events.push(event);
    logger.info({ event }, "Product Analytics: User Rejected Proposed Action");
  }

  static trackOverride(
    tenantId: string,
    workspaceId: string,
    userId: string,
    actionId: string,
    fieldName: string,
    oldValue: any,
    newValue: any
  ): void {
    const event: AnalyticsEvent = {
      tenantId,
      workspaceId,
      userId,
      eventType: "OVERRIDE",
      actionId,
      metadata: { fieldName, oldValue, newValue },
      timestamp: new Date().toISOString(),
    };
    this.events.push(event);
    logger.info({ event }, "Product Analytics: User Overrode Action Field");
  }

  static listEvents(tenantId: string, workspaceId: string): AnalyticsEvent[] {
    return this.events.filter((e) => e.tenantId === tenantId && e.workspaceId === workspaceId);
  }

  static clear(): void {
    this.events = [];
  }
}
