import type { IGraphRepository, FindEdgesOptions } from "../domain/ports";
import { GraphEdge } from "../domain/entities/edge";
import type { CreateGraphEdgeInput, UpdateGraphEdgeInput, StandardRelationshipType } from "../domain/types";

export class InMemoryGraphRepository implements IGraphRepository {
  private edges = new Map<string, GraphEdge>();

  async createEdge(input: CreateGraphEdgeInput): Promise<GraphEdge> {
    // Prevent exact duplicate active edge
    for (const edge of this.edges.values()) {
      if (
        edge.tenantId === input.tenantId &&
        edge.workspaceId === input.workspaceId &&
        edge.sourceId === input.sourceId &&
        edge.targetId === input.targetId &&
        edge.relationType === input.relationType &&
        edge.status === "active"
      ) {
        return edge;
      }
    }

    const edge = GraphEdge.create(input);
    this.edges.set(edge.id, edge);
    return edge;
  }

  async updateEdge(input: UpdateGraphEdgeInput): Promise<GraphEdge | null> {
    const edge = this.edges.get(input.id);
    if (!edge) return null;

    if (input.metadata) {
      edge.updateMetadata(input.metadata, input.updatedBy);
    }
    if (input.status === "archived") {
      edge.archive(input.updatedBy);
    }
    return edge;
  }

  async deleteEdge(id: string, updatedBy: string): Promise<boolean> {
    const edge = this.edges.get(id);
    if (!edge) return false;
    edge.archive(updatedBy);
    return true;
  }

  async findEdgeById(id: string): Promise<GraphEdge | null> {
    const edge = this.edges.get(id);
    return edge ? new GraphEdge(edge.toJSON()) : null;
  }

  async findEdges(options: FindEdgesOptions): Promise<GraphEdge[]> {
    const results: GraphEdge[] = [];
    const statusFilter = options.status || "active";

    for (const edge of this.edges.values()) {
      if (edge.tenantId !== options.tenantId || edge.workspaceId !== options.workspaceId) continue;
      if (edge.status !== statusFilter) continue;

      if (options.sourceId && edge.sourceId !== options.sourceId) continue;
      if (options.targetId && edge.targetId !== options.targetId) continue;

      if (options.relationTypes && options.relationTypes.length > 0) {
        if (!options.relationTypes.includes(edge.relationType)) continue;
      }

      results.push(new GraphEdge(edge.toJSON()));
    }

    const offset = options.offset || 0;
    const limit = options.limit || results.length;
    return results.slice(offset, offset + limit);
  }

  async getNeighbors(
    nodeId: string,
    options?: {
      tenantId: string;
      workspaceId: string;
      relationTypes?: StandardRelationshipType[];
      direction?: "outgoing" | "incoming" | "both";
    }
  ): Promise<GraphEdge[]> {
    if (!options) return [];
    const dir = options.direction || "both";
    const results: GraphEdge[] = [];

    for (const edge of this.edges.values()) {
      if (edge.tenantId !== options.tenantId || edge.workspaceId !== options.workspaceId) continue;
      if (edge.status !== "active") continue;

      if (options.relationTypes && options.relationTypes.length > 0) {
        if (!options.relationTypes.includes(edge.relationType)) continue;
      }

      const isOutgoing = edge.sourceId === nodeId;
      const isIncoming = edge.targetId === nodeId;

      if (dir === "outgoing" && isOutgoing) {
        results.push(new GraphEdge(edge.toJSON()));
      } else if (dir === "incoming" && isIncoming) {
        results.push(new GraphEdge(edge.toJSON()));
      } else if (dir === "both" && (isOutgoing || isIncoming)) {
        results.push(new GraphEdge(edge.toJSON()));
      }
    }

    return results;
  }

  async getParents(
    tenantId: string,
    workspaceId: string,
    nodeId: string,
    relationType?: StandardRelationshipType
  ): Promise<GraphEdge[]> {
    const rels = relationType ? [relationType] : undefined;
    return this.getNeighbors(nodeId, {
      tenantId,
      workspaceId,
      direction: "incoming",
      relationTypes: rels,
    });
  }

  async getChildren(
    tenantId: string,
    workspaceId: string,
    nodeId: string,
    relationType?: StandardRelationshipType
  ): Promise<GraphEdge[]> {
    const rels = relationType ? [relationType] : undefined;
    return this.getNeighbors(nodeId, {
      tenantId,
      workspaceId,
      direction: "outgoing",
      relationTypes: rels,
    });
  }

  async resolveBacklinks(
    tenantId: string,
    workspaceId: string,
    targetId: string,
    relationTypes?: StandardRelationshipType[]
  ): Promise<GraphEdge[]> {
    return this.findEdges({
      tenantId,
      workspaceId,
      targetId,
      relationTypes,
      direction: "incoming",
      status: "active",
    });
  }

  clear(): void {
    this.edges.clear();
  }
}
