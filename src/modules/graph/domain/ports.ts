import type { GraphEdge } from "./entities/edge";
import type { GraphEdgeData, CreateGraphEdgeInput, UpdateGraphEdgeInput, StandardRelationshipType } from "./types";

export interface FindEdgesOptions {
  tenantId: string;
  workspaceId: string;
  sourceId?: string;
  targetId?: string;
  relationTypes?: StandardRelationshipType[];
  direction?: "outgoing" | "incoming" | "both";
  status?: "active" | "archived";
  limit?: number;
  offset?: number;
}

export interface IGraphRepository {
  createEdge(input: CreateGraphEdgeInput): Promise<GraphEdge>;
  updateEdge(input: UpdateGraphEdgeInput): Promise<GraphEdge | null>;
  deleteEdge(id: string, updatedBy: string): Promise<boolean>;
  findEdgeById(id: string): Promise<GraphEdge | null>;
  findEdges(options: FindEdgesOptions): Promise<GraphEdge[]>;
  getNeighbors(
    nodeId: string,
    options?: {
      tenantId: string;
      workspaceId: string;
      relationTypes?: StandardRelationshipType[];
      direction?: "outgoing" | "incoming" | "both";
    }
  ): Promise<GraphEdge[]>;
  getParents(tenantId: string, workspaceId: string, nodeId: string, relationType?: StandardRelationshipType): Promise<GraphEdge[]>;
  getChildren(tenantId: string, workspaceId: string, nodeId: string, relationType?: StandardRelationshipType): Promise<GraphEdge[]>;
  resolveBacklinks(tenantId: string, workspaceId: string, targetId: string, relationTypes?: StandardRelationshipType[]): Promise<GraphEdge[]>;
}
