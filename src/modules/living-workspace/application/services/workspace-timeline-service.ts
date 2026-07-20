/**
 * Workspace Timeline Application Service
 */

import { PlatformEventBus } from "../../../../platform/events";
import { LIVING_WORKSPACE_EVENTS } from "../../domain/events";
import type {
  TimelineEvent,
  TimelineEventType,
  TimelineFilter,
  TimelineSnapshot,
  ActivitySummary,
} from "../../domain/types";

export class WorkspaceTimelineService {
  private events: TimelineEvent[] = [];
  private snapshots: Map<string, TimelineSnapshot> = new Map();

  constructor(private eventBus: PlatformEventBus) {}

  public recordEvent(eventInput: Omit<TimelineEvent, "id" | "timestamp">): TimelineEvent {
    const event: TimelineEvent = {
      ...eventInput,
      id: `evt_tl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };

    this.events.push(event);

    this.eventBus.publish(LIVING_WORKSPACE_EVENTS.TIMELINE_EVENT_RECORDED, {
      workspaceId: event.workspaceId,
      eventId: event.id,
      eventType: event.eventType,
      actorId: event.actorId,
      timestamp: event.timestamp,
    });

    return event;
  }

  public getEvents(filter: TimelineFilter): TimelineEvent[] {
    let result = this.events.filter((e) => e.workspaceId === filter.workspaceId);

    if (filter.eventTypes && filter.eventTypes.length > 0) {
      const typeSet = new Set(filter.eventTypes);
      result = result.filter((e) => typeSet.has(e.eventType));
    }

    if (filter.startDate !== undefined) {
      const start = filter.startDate;
      result = result.filter((e) => e.timestamp >= start);
    }

    if (filter.endDate !== undefined) {
      const end = filter.endDate;
      result = result.filter((e) => e.timestamp <= end);
    }

    if (filter.entityId) {
      result = result.filter((e) => e.entityId === filter.entityId);
    }

    if (filter.actorId) {
      result = result.filter((e) => e.actorId === filter.actorId);
    }

    if (filter.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      result = result.filter(
        (e) => e.summary.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
      );
    }

    // Chronological order (newest first)
    result.sort((a, b) => b.timestamp - a.timestamp);

    const offset = filter.offset || 0;
    if (filter.limit !== undefined) {
      result = result.slice(offset, offset + filter.limit);
    } else if (offset > 0) {
      result = result.slice(offset);
    }

    return result;
  }

  public groupEventsByCategory(workspaceId: string): Record<string, TimelineEvent[]> {
    const wsEvents = this.events.filter((e) => e.workspaceId === workspaceId);
    const groups: Record<string, TimelineEvent[]> = {};

    for (const ev of wsEvents) {
      if (!groups[ev.category]) {
        groups[ev.category] = [];
      }
      const catList = groups[ev.category];
      if (catList) {
        catList.push(ev);
      }
    }
    return groups;
  }

  public replayEvents(workspaceId: string, fromTimestamp: number, toTimestamp: number): TimelineEvent[] {
    return this.events
      .filter((e) => e.workspaceId === workspaceId && e.timestamp >= fromTimestamp && e.timestamp <= toTimestamp)
      .sort((a, b) => a.timestamp - b.timestamp); // Ascending for replay
  }

  public createSnapshot(workspaceId: string, milestoneName: string, stateSummary: Record<string, unknown> = {}): TimelineSnapshot {
    const wsEvents = this.events.filter((e) => e.workspaceId === workspaceId);
    const snapshot: TimelineSnapshot = {
      snapshotId: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      workspaceId,
      timestamp: Date.now(),
      eventCount: wsEvents.length,
      stateSummary,
      milestoneName,
    };

    this.snapshots.set(snapshot.snapshotId, snapshot);
    return snapshot;
  }

  public getSnapshots(workspaceId: string): TimelineSnapshot[] {
    return Array.from(this.snapshots.values()).filter((s) => s.workspaceId === workspaceId);
  }

  public generateActivitySummary(workspaceId: string, periodMs?: number): ActivitySummary {
    const now = Date.now();
    const start = periodMs ? now - periodMs : 0;
    const wsEvents = this.events.filter((e) => e.workspaceId === workspaceId && e.timestamp >= start);

    const categoryBreakdown: Record<string, number> = {};
    const actorCounts = new Map<string, number>();

    for (const ev of wsEvents) {
      categoryBreakdown[ev.category] = (categoryBreakdown[ev.category] || 0) + 1;
      actorCounts.set(ev.actorId, (actorCounts.get(ev.actorId) || 0) + 1);
    }

    const topActors = Array.from(actorCounts.entries())
      .map(([actorId, count]) => ({ actorId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      workspaceId,
      totalEvents: wsEvents.length,
      categoryBreakdown,
      topActors,
      timePeriod: { start, end: now },
    };
  }
}
