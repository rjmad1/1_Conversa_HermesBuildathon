import type { PlatformEvent } from "../../../../platform/events";
import type { WorkspaceSelection } from "../value-objects/workspace-selection";
import type { WorkspaceMode } from "../entities/workspace-session";

export const WORKSPACE_EVENT_TYPES = {
  SESSION_RESTORED: "workspace.session_restored",
  STATE_CHANGED: "workspace.state_changed",
  SELECTION_CHANGED: "workspace.selection_changed",
  LAYOUT_UPDATED: "workspace.layout_updated",
  NAVIGATION_TRANSITION: "workspace.navigation_transition",
  COMMAND_EXECUTED: "workspace.command_executed",
  MODE_CHANGED: "workspace.mode_changed",
  PROFILE_SWITCHED: "workspace.profile_switched",
} as const;

export interface SelectionChangedPayload {
  selection: WorkspaceSelection;
  previousSelection?: WorkspaceSelection;
}

export interface NavigationTransitionPayload {
  fromUri?: string;
  toUri: string;
  title: string;
  intent?: string;
}

export interface ModeChangedPayload {
  previousMode: WorkspaceMode;
  newMode: WorkspaceMode;
}
