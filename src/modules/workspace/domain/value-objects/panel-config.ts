export type PanelType = "Main" | "Sidebar" | "Inspector" | "Dock" | "Bottom" | "Floating";

export type PanelDockState = "Expanded" | "Collapsed" | "Hidden" | "Pinned";

export interface PanelConfig {
  id: string;
  type: PanelType;
  title: string;
  dockState: PanelDockState;
  splitRatio?: number; // 0.0 - 1.0
  activeTabId?: string;
  tabs?: { id: string; title: string; contentUri: string; isCloseable?: boolean }[];
  minWidth?: number;
  minHeight?: number;
}
