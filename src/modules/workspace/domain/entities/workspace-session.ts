import type { NavigationNode } from "../value-objects/navigation-node";
import type { WorkspaceSelection } from "../value-objects/workspace-selection";

export type WorkspaceMode = "Focus" | "Analysis" | "Presentation" | "Review" | "Standard";

export interface NavigationStackItem {
  id: string;
  uri: string;
  title: string;
  nodeType?: string;
  stateSnapshot?: Record<string, unknown>;
  timestamp: number;
}

export interface WorkspaceSession {
  id: string;
  tenantId: string;
  workspaceId: string;
  userId: string;
  activeProfileId: string;
  activeLayoutId: string;
  mode: WorkspaceMode;
  historyStack: NavigationStackItem[];
  historyIndex: number;
  selection: WorkspaceSelection;
  pinnedNodeIds: string[];
  recentNodeIds: string[];
  openedTabs: { id: string; title: string; uri: string }[];
  activeTabId?: string;
  commandHistory: { commandId: string; timestamp: number; success: boolean }[];
  createdAt: number;
  updatedAt: number;
  version: number;
}
