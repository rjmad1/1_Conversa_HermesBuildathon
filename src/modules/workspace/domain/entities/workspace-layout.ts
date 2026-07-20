import type { PanelConfig } from "../value-objects/panel-config";

export interface WorkspaceLayout {
  id: string;
  name: string;
  profileId: string;
  panels: PanelConfig[];
  mainSplitRatio: number;
  sidebarWidth: number;
  inspectorWidth: number;
  isSidebarCollapsed: boolean;
  isInspectorCollapsed: boolean;
  activeMainTabId?: string;
  openTabs: { id: string; title: string; uri: string; type: string }[];
  updatedAt: number;
}
