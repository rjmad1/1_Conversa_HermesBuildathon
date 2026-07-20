import { CoreQueryAST } from "../../../query/domain/ast";

export type SavedSearchScope = "system" | "organization" | "workspace" | "team" | "user";

export interface SavedSearch {
  id: string;
  tenantId: string;
  workspaceId: string;
  userId?: string;
  name: string;
  description?: string;
  queryAST: CoreQueryAST;
  rankingProfile?: string;
  contextProfile?: string;
  defaultViewId?: string;
  scope: SavedSearchScope;
  isFavorite: boolean;
  usageCount: number;
  category?: string;
  tags?: string[];
  version: number;
  createdAt: number;
  updatedAt: number;
}
