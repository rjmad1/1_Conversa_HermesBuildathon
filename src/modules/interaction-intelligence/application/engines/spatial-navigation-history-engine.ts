/**
 * Engine 2: Spatial Navigation History Engine
 * Implements Workspace Snapshot navigation tree for loss-less Back, Forward, Breadcrumb & Deep Link traversal.
 */
import { PlatformEventBus } from "../../../../platform/events";
import type {
  WorkspaceSnapshot,
  NavigationNode,
  SpatialTrail,
  DeepLinkToken,
} from "../../domain/domain-models";
import { INTERACTION_INTELLIGENCE_EVENTS } from "../../domain/events/domain-events";
import type { ISpatialHistoryStore } from "../../domain/ports/provider-ports";

export class SpatialNavigationHistoryEngine {
  private historyStack: WorkspaceSnapshot[] = [];
  private currentIndex: number = -1;

  constructor(
    private spatialStore: ISpatialHistoryStore,
    private eventBus: PlatformEventBus
  ) {}

  public async captureSnapshot(snapshot: Omit<WorkspaceSnapshot, "snapshotId" | "timestamp" | "version">): Promise<WorkspaceSnapshot> {
    const fullSnapshot: WorkspaceSnapshot = {
      ...snapshot,
      snapshotId: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      version: 1,
    };

    // If navigating after being back in stack, drop forward history
    if (this.currentIndex >= 0 && this.currentIndex < this.historyStack.length - 1) {
      this.historyStack = this.historyStack.slice(0, this.currentIndex + 1);
    }

    this.historyStack.push(fullSnapshot);
    this.currentIndex = this.historyStack.length - 1;

    await this.spatialStore.saveSnapshot(fullSnapshot);
    await this.eventBus.publish(INTERACTION_INTELLIGENCE_EVENTS.SNAPSHOT_CAPTURED, {
      snapshot: fullSnapshot,
    });

    return fullSnapshot;
  }

  public canGoBack(): boolean {
    return this.currentIndex > 0;
  }

  public canGoForward(): boolean {
    return this.currentIndex < this.historyStack.length - 1;
  }

  public async navigateBack(): Promise<WorkspaceSnapshot | null> {
    if (!this.canGoBack()) return null;
    this.currentIndex--;
    const snapshot = this.historyStack[this.currentIndex] ?? null;

    if (snapshot) {
      await this.eventBus.publish(INTERACTION_INTELLIGENCE_EVENTS.SNAPSHOT_RESTORED, { snapshot });
    }
    return snapshot;
  }

  public async navigateForward(): Promise<WorkspaceSnapshot | null> {
    if (!this.canGoForward()) return null;
    this.currentIndex++;
    const snapshot = this.historyStack[this.currentIndex] ?? null;

    if (snapshot) {
      await this.eventBus.publish(INTERACTION_INTELLIGENCE_EVENTS.SNAPSHOT_RESTORED, { snapshot });
    }
    return snapshot;
  }

  public getBreadcrumbs(): NavigationNode[] {
    return this.historyStack.slice(0, this.currentIndex + 1).map((s) => s.activeNode);
  }

  public getRecentSnapshots(limit: number = 10): WorkspaceSnapshot[] {
    return [...this.historyStack].reverse().slice(0, limit);
  }

  public generateDeepLink(workspaceId: string, primaryEntityId: string): DeepLinkToken {
    const currentSnap = this.historyStack[this.currentIndex];
    return {
      token: `dl_${Math.random().toString(36).substring(2, 10)}`,
      workspaceId,
      primaryEntityId,
      snapshotId: currentSnap?.snapshotId,
      contextId: currentSnap?.contextStackId,
    };
  }

  public async saveTrail(name: string): Promise<SpatialTrail> {
    const trail: SpatialTrail = {
      trailId: `trail_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      snapshots: [...this.historyStack],
      createdAt: Date.now(),
    };

    await this.eventBus.publish(INTERACTION_INTELLIGENCE_EVENTS.TRAIL_SAVED, { trail });
    return trail;
  }
}
