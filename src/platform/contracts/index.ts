export type ScopeLevel = "System" | "Organization" | "Workspace" | "Team" | "User" | "Session";

export type CapabilityType =
  | "Navigation"
  | "Command"
  | "Sidebar"
  | "Panel"
  | "Toolbar"
  | "Widget"
  | "InspectorSection"
  | "View"
  | "Search";

export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  capabilities: CapabilityType[];
  dependencies?: string[];
  scope?: ScopeLevel;
  permissions?: string[];
  author?: string;
  enabledByDefault?: boolean;
}

export type ProviderLifecycleState =
  | "Registered"
  | "Validating"
  | "Active"
  | "Suspended"
  | "Deactivated"
  | "Error";

export interface IWorkspaceProvider {
  id: string;
  manifest: ExtensionManifest;
  state: ProviderLifecycleState;
  isEnabled(context: Record<string, unknown>): boolean;
  initialize?(): Promise<void>;
  activate?(): Promise<void>;
  deactivate?(): Promise<void>;
}
