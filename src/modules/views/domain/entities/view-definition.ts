import { ViewQueryAST, ColumnSpec } from "../ast/query-ast";

export type LayoutType =
  | "list"
  | "table"
  | "board"
  | "calendar"
  | "timeline"
  | "gallery"
  | "hierarchy"
  | "tree"
  | "network"
  | "custom";

export interface ViewPermissions {
  isPublic?: boolean;
  allowedUserIds?: string[];
  allowedRoles?: string[];
}

export interface ViewDefinition {
  id: string;
  tenantId: string;
  workspaceId: string;
  name: string;
  description?: string;
  objectTypes: string[]; // Target object type IDs (multi-type supported)
  layoutType: LayoutType;
  queryAST: ViewQueryAST;
  columns: ColumnSpec[];
  fieldVisibility: Record<string, boolean>;
  defaultActions: string[];
  permissions: ViewPermissions;
  savedState?: Record<string, any>;
  isSystem: boolean;
  isPinned: boolean;
  isFavorite: boolean;
  parentViewId?: string;
  version: number;
  createdAt: number;
  updatedAt: number;
}
