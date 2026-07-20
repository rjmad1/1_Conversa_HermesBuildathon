import type { IGraphRepository } from "../domain/ports";
import type { CreateGraphEdgeInput, StandardRelationshipType } from "../domain/types";
import { GraphEdge } from "../domain/entities/edge";
import type { Subgraph } from "../domain/entities/subgraph";
import type { GraphValidationService } from "./validation-service";
import type { TraversalEngine, PathResult } from "./traversal-engine";
import type { NeighborhoodCache } from "../infrastructure/neighborhood-cache";
import type { IKnowledgeRepository } from "../../knowledge/repository";
import { GraphEventDispatcher } from "../domain/events/graph-events";
import type { ValidationResult } from "../../metadata/domain/types";

export interface ConnectObjectsInput extends CreateGraphEdgeInput {}

export class WorkspaceGraphService {
  constructor(
    private graphRepository: IGraphRepository,
    private validationService?: GraphValidationService,
    private traversalEngine?: TraversalEngine,
    private knowledgeRepository?: IKnowledgeRepository,
    private cache?: NeighborhoodCache
  ) {}

  async connectObjects(input: ConnectObjectsInput): Promise<{ edge?: GraphEdge; validation: ValidationResult }> {
    if (this.validationService) {
      const val = await this.validationService.validateEdgeCreation(input.tenantId, input.workspaceId, input);
      if (!val.valid) {
        return { validation: val };
      }
    }

    const edge = await this.graphRepository.createEdge(input);

    if (this.cache) {
      this.cache.invalidateNode(input.tenantId, input.workspaceId, input.sourceId);
      this.cache.invalidateNode(input.tenantId, input.workspaceId, input.targetId);
    }

    await GraphEventDispatcher.dispatch({
      type: "EdgeCreated",
      tenantId: input.tenantId,
      workspaceId: input.workspaceId,
      edgeId: edge.id,
      sourceId: input.sourceId,
      targetId: input.targetId,
      relationType: input.relationType,
      timestamp: Date.now(),
    });

    const backlinks = await this.resolveBacklinks(input.tenantId, input.workspaceId, input.targetId);
    await GraphEventDispatcher.dispatch({
      type: "BacklinksUpdated",
      tenantId: input.tenantId,
      workspaceId: input.workspaceId,
      targetId: input.targetId,
      count: backlinks.length,
      timestamp: Date.now(),
    });

    return { edge, validation: { valid: true, errors: [] } };
  }

  async disconnectObjects(tenantId: string, workspaceId: string, edgeId: string, updatedBy: string): Promise<boolean> {
    const existing = await this.graphRepository.findEdgeById(edgeId);
    if (!existing) return false;

    const deleted = await this.graphRepository.deleteEdge(edgeId, updatedBy);
    if (deleted && this.cache) {
      this.cache.invalidateNode(tenantId, workspaceId, existing.sourceId);
      this.cache.invalidateNode(tenantId, workspaceId, existing.targetId);
    }

    if (deleted) {
      await GraphEventDispatcher.dispatch({
        type: "EdgeDeleted",
        tenantId,
        workspaceId,
        edgeId,
        sourceId: existing.sourceId,
        targetId: existing.targetId,
        relationType: existing.relationType,
        timestamp: Date.now(),
      });
    }

    return deleted;
  }

  async findRelatedObjects(
    tenantId: string,
    workspaceId: string,
    nodeId: string,
    options?: { relationTypes?: StandardRelationshipType[]; direction?: "outgoing" | "incoming" | "both" }
  ): Promise<GraphEdge[]> {
    return this.graphRepository.getNeighbors(nodeId, {
      tenantId,
      workspaceId,
      relationTypes: options?.relationTypes,
      direction: options?.direction,
    });
  }

  async findPath(
    tenantId: string,
    workspaceId: string,
    sourceId: string,
    targetId: string,
    relationTypes?: StandardRelationshipType[]
  ): Promise<PathResult> {
    if (!this.traversalEngine) {
      throw new Error("TraversalEngine is required for pathfinding operations.");
    }
    return this.traversalEngine.findShortestPath(tenantId, workspaceId, sourceId, targetId, relationTypes);
  }

  async resolveBacklinks(
    tenantId: string,
    workspaceId: string,
    targetId: string,
    relationTypes?: StandardRelationshipType[]
  ): Promise<GraphEdge[]> {
    return this.graphRepository.resolveBacklinks(tenantId, workspaceId, targetId, relationTypes);
  }

  async exploreNeighborhood(tenantId: string, workspaceId: string, nodeId: string, depth = 2): Promise<Subgraph> {
    if (!this.traversalEngine) {
      throw new Error("TraversalEngine is required for neighborhood exploration.");
    }
    return this.traversalEngine.traverse({
      tenantId,
      workspaceId,
      startNodeId: nodeId,
      strategy: "Neighborhood",
      maxDepth: depth,
      includeNodes: true,
    });
  }

  async findOrphanObjects(tenantId: string, workspaceId: string): Promise<string[]> {
    if (!this.knowledgeRepository) return [];
    const allObjects = await this.knowledgeRepository.listByWorkspace(tenantId, workspaceId);
    const orphans: string[] = [];

    for (const obj of allObjects) {
      const edges = await this.graphRepository.getNeighbors(obj.id, { tenantId, workspaceId });
      if (edges.length === 0) {
        orphans.push(obj.id);
      }
    }

    return orphans;
  }

  async findBrokenReferences(tenantId: string, workspaceId: string): Promise<GraphEdge[]> {
    if (!this.knowledgeRepository) return [];
    const allEdges = await this.graphRepository.findEdges({ tenantId, workspaceId, status: "active" });
    const broken: GraphEdge[] = [];

    for (const edge of allEdges) {
      const source = await this.knowledgeRepository.findById(edge.sourceId);
      const target = await this.knowledgeRepository.findById(edge.targetId);
      if (!source || !target) {
        broken.push(edge);
      }
    }

    return broken;
  }
}
