import type { IGraphRepository, FindEdgesOptions } from "../domain/ports";
import { GraphEdge } from "../domain/entities/edge";
import type { CreateGraphEdgeInput, UpdateGraphEdgeInput, StandardRelationshipType } from "../domain/types";

export interface ConvexClientFacade {
  mutation(path: string, args: any): Promise<any>;
  query(path: string, args: any): Promise<any>;
}

export class ConvexGraphRepository implements IGraphRepository {
  constructor(private convexClient: ConvexClientFacade) {}

  async createEdge(input: CreateGraphEdgeInput): Promise<GraphEdge> {
    const now = Date.now();
    const id = `edge_${now}_${Math.random().toString(36).substring(2, 9)}`;
    const result = await this.convexClient.mutation("graph:createGraphEdge", {
      id,
      ...input,
    });
    return new GraphEdge(result);
  }

  async updateEdge(input: UpdateGraphEdgeInput): Promise<GraphEdge | null> {
    const result = await this.convexClient.mutation("graph:updateGraphEdge", input);
    return result ? new GraphEdge(result) : null;
  }

  async deleteEdge(id: string, updatedBy: string): Promise<boolean> {
    const result = await this.convexClient.mutation("graph:updateGraphEdge", {
      id,
      status: "archived",
      updatedBy,
    });
    return !!result;
  }

  async findEdgeById(id: string): Promise<GraphEdge | null> {
    const list = await this.convexClient.query("graph:findGraphEdges", { id });
    if (list && list.length > 0) {
      return new GraphEdge(list[0]);
    }
    return null;
  }

  async findEdges(options: FindEdgesOptions): Promise<GraphEdge[]> {
    const list = await this.convexClient.query("graph:findGraphEdges", {
      tenantId: options.tenantId,
      workspaceId: options.workspaceId,
      sourceId: options.sourceId,
      targetId: options.targetId,
      relationType: options.relationTypes && options.relationTypes.length === 1 ? options.relationTypes[0] : undefined,
      status: options.status || "active",
    });

    let results = (list || []).map((item: any) => new GraphEdge(item));

    if (options.relationTypes && options.relationTypes.length > 1) {
      results = results.filter((e: GraphEdge) => options.relationTypes!.includes(e.relationType));
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
    const list = await this.convexClient.query("graph:getNeighbors", {
      tenantId: options.tenantId,
      workspaceId: options.workspaceId,
      nodeId,
      direction: options.direction || "both",
    });

    let results = (list || []).map((item: any) => new GraphEdge(item));

    if (options.relationTypes && options.relationTypes.length > 0) {
      results = results.filter((e: GraphEdge) => options.relationTypes!.includes(e.relationType));
    }

    return results;
  }

  async getParents(
    tenantId: string,
    workspaceId: string,
    nodeId: string,
    relationType?: StandardRelationshipType
  ): Promise<GraphEdge[]> {
    return this.getNeighbors(nodeId, {
      tenantId,
      workspaceId,
      direction: "incoming",
      relationTypes: relationType ? [relationType] : undefined,
    });
  }

  async getChildren(
    tenantId: string,
    workspaceId: string,
    nodeId: string,
    relationType?: StandardRelationshipType
  ): Promise<GraphEdge[]> {
    return this.getNeighbors(nodeId, {
      tenantId,
      workspaceId,
      direction: "outgoing",
      relationTypes: relationType ? [relationType] : undefined,
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
}
