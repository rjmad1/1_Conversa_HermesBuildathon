import { LayoutType } from "./view-definition";

export interface ResolvedColumn {
  key: string;
  label: string;
  type: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
}

export interface ViewItem {
  id: string;
  type: string;
  title: string;
  summary?: string;
  properties: Record<string, any>;
  metadata: Record<string, any>;
  labels: string[];
  status?: string;
  createdAt: number;
  updatedAt: number;
  parentId?: string;
  depth?: number;
  displayMeta?: Record<string, any>;
}

export interface ViewEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: string;
  metadata?: Record<string, any>;
}

export interface ViewItemGroup {
  id: string;
  key: string;
  label: string;
  count: number;
  items: ViewItem[];
  aggregates?: Record<string, any>;
}

export interface CanonicalViewModel {
  viewId: string;
  viewName: string;
  layoutType: LayoutType;
  metadata: {
    totalCount: number;
    filteredCount: number;
    resolvedAt: number;
    executionMode: "interactive" | "analytical" | "export";
  };
  columns: ResolvedColumn[];
  groups: ViewItemGroup[];
  items: ViewItem[];
  relationships: ViewEdge[];
  aggregates: Record<string, any>;
  pagination: {
    startIndex: number;
    pageSize: number;
    hasMore: boolean;
    nextCursor?: string;
  };
  layoutHints: Record<string, any>;
}
