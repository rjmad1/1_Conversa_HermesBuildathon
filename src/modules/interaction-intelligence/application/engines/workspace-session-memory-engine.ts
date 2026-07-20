/**
 * Engine 1: Workspace Session Memory Engine
 * Handles Tier 1 in-memory state & Tier 2 async background persistence.
 */
import { PlatformEventBus } from "../../../../platform/events";
import type {
  WorkspaceSessionMemory,
  PaneState,
  CameraPosition,
  InspectorState,
  FilterState,
} from "../../domain/domain-models";
import { INTERACTION_INTELLIGENCE_EVENTS } from "../../domain/events/domain-events";
import type { ISessionMemoryStore } from "../../domain/ports/provider-ports";

export class WorkspaceSessionMemoryEngine {
  private currentMemory: WorkspaceSessionMemory | null = null;

  constructor(
    private sessionStore: ISessionMemoryStore,
    private eventBus: PlatformEventBus
  ) {}

  public async initializeSession(
    tenantId: string,
    workspaceId: string,
    userId: string
  ): Promise<WorkspaceSessionMemory> {
    const loaded = await this.sessionStore.loadSession(workspaceId, userId);
    if (loaded) {
      this.currentMemory = loaded;
    } else {
      this.currentMemory = {
        sessionId: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tenantId,
        workspaceId,
        userId,
        openPanes: [],
        graphCameraPosition: { x: 0, y: 0, zoom: 1.0 },
        selectedNodeIds: [],
        expandedSectionIds: [],
        activeFilters: { tags: [], customFilters: {} },
        searchState: { query: "" },
        commandHistory: [],
        inspectorState: { isOpen: false, activeTab: "details", width: 320 },
        splitLayout: {
          sidebarWidth: 260,
          mainRatio: 0.65,
          inspectorWidth: 320,
          isSidebarCollapsed: false,
          isInspectorCollapsed: false,
        },
        lastUpdated: Date.now(),
      };
      await this.saveState();
    }

    await this.eventBus.publish(INTERACTION_INTELLIGENCE_EVENTS.SESSION_MEMORY_UPDATED, {
      session: this.currentMemory,
    });

    return this.currentMemory;
  }

  public getCurrentMemory(): WorkspaceSessionMemory | null {
    return this.currentMemory;
  }

  public updatePaneState(panes: PaneState[]): void {
    if (!this.currentMemory) return;
    this.currentMemory.openPanes = panes;
    this.currentMemory.lastUpdated = Date.now();
    this.eventBus.publish(INTERACTION_INTELLIGENCE_EVENTS.PANE_STATE_CHANGED, { panes });
    this.saveState();
  }

  public updateCameraPosition(camera: CameraPosition): void {
    if (!this.currentMemory) return;
    this.currentMemory.graphCameraPosition = camera;
    this.currentMemory.lastUpdated = Date.now();
    this.eventBus.publish(INTERACTION_INTELLIGENCE_EVENTS.CAMERA_MOVED, { camera });
    this.saveState();
  }

  public updateInspectorState(inspector: InspectorState): void {
    if (!this.currentMemory) return;
    this.currentMemory.inspectorState = inspector;
    this.currentMemory.lastUpdated = Date.now();
    this.saveState();
  }

  public updateFilters(filters: FilterState): void {
    if (!this.currentMemory) return;
    this.currentMemory.activeFilters = filters;
    this.currentMemory.lastUpdated = Date.now();
    this.saveState();
  }

  public updateSearchState(query: string, activeCategory?: string): void {
    if (!this.currentMemory) return;
    this.currentMemory.searchState = { query, activeCategory };
    this.currentMemory.lastUpdated = Date.now();
    this.saveState();
  }

  public recordCommand(commandId: string): void {
    if (!this.currentMemory) return;
    this.currentMemory.commandHistory.unshift(commandId);
    if (this.currentMemory.commandHistory.length > 50) {
      this.currentMemory.commandHistory.pop();
    }
    this.currentMemory.lastUpdated = Date.now();
    this.saveState();
  }

  public async saveState(): Promise<void> {
    if (this.currentMemory) {
      await this.sessionStore.saveSession(this.currentMemory);
    }
  }
}
