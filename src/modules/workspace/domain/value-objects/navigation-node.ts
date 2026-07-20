export type NavigationNodeType =
  | "Inbox"
  | "Today"
  | "Recent"
  | "Favorites"
  | "Pinned"
  | "Projects"
  | "Collections"
  | "Spaces"
  | "Templates"
  | "SavedSearches"
  | "Views"
  | "Hierarchy"
  | "Custom";

export interface NavigationNode {
  id: string;
  label: string;
  type: NavigationNodeType;
  icon?: string;
  badge?: string | number;
  uri?: string;
  targetId?: string;
  targetType?: string;
  parentId?: string;
  children?: NavigationNode[];
  order?: number;
  isPinned?: boolean;
  isFavorite?: boolean;
  metadata?: Record<string, unknown>;
}
