export interface BreadcrumbNode {
  id: string;
  title: string;
  type: string;
}

export interface ParentChainNode {
  id: string;
  title: string;
  relationType: string;
}

export interface GraphNeighborNode {
  id: string;
  title: string;
  type: string;
  distance: number;
  relationType: string;
}

export interface CanonicalContext {
  rootId: string;
  breadcrumbs: BreadcrumbNode[];
  parentChain: ParentChainNode[];
  children: Array<{ id: string; title: string; relationType: string }>;
  graphNeighborhood: GraphNeighborNode[];
  relationshipSummary: Record<string, number>;
  workspaceContext: {
    tenantId: string;
    workspaceId: string;
    scope: string;
  };
  expansionDepth: number;
  version: number;
}
