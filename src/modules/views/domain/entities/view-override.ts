import { ColumnSpec, ViewQueryAST } from "../ast/query-ast";

export interface ViewOverrideDelta {
  name?: string;
  columns?: ColumnSpec[];
  fieldVisibility?: Record<string, boolean>;
  queryAST?: Partial<ViewQueryAST>;
  savedState?: Record<string, any>;
  isPinned?: boolean;
  isFavorite?: boolean;
}

export interface ViewOverride {
  id: string;
  tenantId: string;
  workspaceId: string;
  userId?: string; // Undefined for workspace override, set for user override
  parentViewId: string; // References base ViewDefinition.id
  overrideType: "workspace" | "user";
  delta: ViewOverrideDelta;
  version: number;
  createdAt: number;
  updatedAt: number;
}
