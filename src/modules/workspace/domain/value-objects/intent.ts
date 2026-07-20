export type IntentCategory =
  | "Navigation"
  | "ObjectAction"
  | "ViewAction"
  | "SearchAction"
  | "SystemAction"
  | "AIAction";

export interface WorkspaceIntent {
  id: string;
  name: string;
  category: IntentCategory;
  description?: string;
  parameters?: Record<string, unknown>;
  targetObjectType?: string;
  requiredPermissions?: string[];
}
