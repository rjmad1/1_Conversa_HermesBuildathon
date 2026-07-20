import type { ScopeLevel } from "../../../../platform/contracts";

export type ProfileRoleType = "Personal" | "Executive" | "Engineering" | "Sales" | "Operations" | "Custom";

export interface WorkspaceProfile {
  id: string;
  name: string;
  role: ProfileRoleType;
  scope: ScopeLevel;
  parentProfileId?: string;
  defaultLayoutId: string;
  enabledNavigationTypes: string[];
  enabledWidgets: string[];
  inspectorSections: string[];
  commandCategories: string[];
  defaultViewIds?: string[];
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}
