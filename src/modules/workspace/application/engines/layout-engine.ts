import type { WorkspaceLayout } from "../../domain/entities/workspace-layout";
import type { PanelConfig } from "../../domain/value-objects/panel-config";
import type { PlatformEventBus } from "../../../../platform/events";
import { WORKSPACE_EVENT_TYPES } from "../../domain/events/workspace-events";

export class LayoutEngine {
  private activeLayout: WorkspaceLayout;

  constructor(initialLayout: WorkspaceLayout, private eventBus: PlatformEventBus) {
    this.activeLayout = initialLayout;
  }

  public getLayout(): WorkspaceLayout {
    return { ...this.activeLayout };
  }

  public toggleSidebar(): void {
    this.activeLayout.isSidebarCollapsed = !this.activeLayout.isSidebarCollapsed;
    this.notifyLayoutUpdate();
  }

  public toggleInspector(): void {
    this.activeLayout.isInspectorCollapsed = !this.activeLayout.isInspectorCollapsed;
    this.notifyLayoutUpdate();
  }

  public updateMainSplitRatio(ratio: number): void {
    this.activeLayout.mainSplitRatio = Math.max(0.1, Math.min(0.9, ratio));
    this.notifyLayoutUpdate();
  }

  public openTab(tab: { id: string; title: string; uri: string; type: string }): void {
    const exists = this.activeLayout.openTabs.some((t) => t.id === tab.id);
    if (!exists) {
      this.activeLayout.openTabs.push(tab);
    }
    this.activeLayout.activeMainTabId = tab.id;
    this.notifyLayoutUpdate();
  }

  public closeTab(tabId: string): void {
    this.activeLayout.openTabs = this.activeLayout.openTabs.filter((t) => t.id !== tabId);
    if (this.activeLayout.activeMainTabId === tabId) {
      const lastTab = this.activeLayout.openTabs[this.activeLayout.openTabs.length - 1];
      this.activeLayout.activeMainTabId = lastTab ? lastTab.id : undefined;
    }
    this.notifyLayoutUpdate();
  }

  public setLayout(layout: WorkspaceLayout): void {
    this.activeLayout = layout;
    this.notifyLayoutUpdate();
  }

  private notifyLayoutUpdate(): void {
    this.activeLayout.updatedAt = Date.now();
    this.eventBus.publish(WORKSPACE_EVENT_TYPES.LAYOUT_UPDATED, { layout: this.activeLayout });
  }
}
