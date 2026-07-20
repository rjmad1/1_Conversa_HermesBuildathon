/**
 * Engine 5: Universal Activity Layer Engine
 * Centralized activity engine with priority event ingestion pipeline and bounded ring buffer.
 */
import { PlatformEventBus } from "../../../../platform/events";
import type { ActivityItem, ActivityKind, ActivityPriority } from "../../domain/domain-models";
import { INTERACTION_INTELLIGENCE_EVENTS } from "../../domain/events/domain-events";
import type { IActivityStreamStore } from "../../domain/ports/provider-ports";

export class UniversalActivityEngine {
  private ringBuffer: ActivityItem[] = [];
  private maxBufferSize: number = 1000;

  constructor(
    private activityStore: IActivityStreamStore,
    private eventBus: PlatformEventBus
  ) {}

  public async logActivity(
    kind: ActivityKind,
    priority: ActivityPriority,
    title: string,
    description: string,
    source: string,
    payload?: Record<string, unknown>,
    actorId?: string
  ): Promise<ActivityItem> {
    const item: ActivityItem = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      kind,
      priority,
      title,
      description,
      actorId,
      source,
      payload,
      status: kind === "Pending_Approval" ? "pending" : "completed",
    };

    // Maintain bounded ring buffer
    this.ringBuffer.unshift(item);
    if (this.ringBuffer.length > this.maxBufferSize) {
      this.ringBuffer.pop();
    }

    await this.activityStore.appendActivity(item);
    await this.eventBus.publish(INTERACTION_INTELLIGENCE_EVENTS.ACTIVITY_LOGGED, {
      activity: item,
    });

    return item;
  }

  public getRecentActivities(limit: number = 50): ActivityItem[] {
    return this.ringBuffer.slice(0, limit);
  }

  public getPendingApprovals(): ActivityItem[] {
    return this.ringBuffer.filter((a) => a.kind === "Pending_Approval" && a.status === "pending");
  }

  public async updateStatus(id: string, status: ActivityItem["status"]): Promise<void> {
    const item = this.ringBuffer.find((a) => a.id === id);
    if (item) {
      item.status = status;
    }
    await this.activityStore.updateActivityStatus(id, status);
  }
}
