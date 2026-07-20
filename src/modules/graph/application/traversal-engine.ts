import type { IGraphRepository } from "../domain/ports";
import type { GraphEdgeData, StandardRelationshipType } from "../domain/types";
import { Subgraph } from "../domain/entities/subgraph";
import type { NeighborhoodCache } from "../infrastructure/neighborhood-cache";
import type { IKnowledgeRepository } from "../../knowledge/repository";
import type { CanonicalKnowledgeObject } from "../../../shared/domain/types";

export interface TraversalParams {
  tenantId: string;
  workspaceId: string;
  startNodeId: string;
  strategy?: "BFS" | "DFS" | "Ancestor" | "Descendant" | "Neighborhood" | "ShortestPath";
  targetNodeId?: string; // For ShortestPath
  direction?: "outgoing" | "incoming" | "both";
  maxDepth?: number; // Default 5, Cap 20
  relationTypes?: StandardRelationshipType[];
  includeNodes?: boolean;
}

export interface PathResult {
  found: boolean;
  pathNodes: string[];
  edges: GraphEdgeData[];
  depth: number;
}

export class TraversalPlanner {
  constructor(private cache?: NeighborhoodCache) {}

  selectExecutionStrategy(params: TraversalParams): "CACHE" | "INDEXED_ITERATIVE" {
    const depth = params.maxDepth ?? 3;
    const isNeighborhood = params.strategy === "Neighborhood" || depth <= 2;

    if (isNeighborhood && this.cache) {
      const cached = this.cache.get(params.tenantId, params.workspaceId, params.startNodeId, depth);
      if (cached) return "CACHE";
    }

    return "INDEXED_ITERATIVE";
  }
}

export class TraversalEngine {
  private planner: TraversalPlanner;

  constructor(
    private graphRepository: IGraphRepository,
    private knowledgeRepository?: IKnowledgeRepository,
    private cache?: NeighborhoodCache
  ) {
    this.planner = new TraversalPlanner(cache);
  }

  async traverse(params: TraversalParams): Promise<Subgraph> {
    const startTime = Date.now();
    const strategy = params.strategy || "BFS";
    const maxDepth = Math.min(params.maxDepth ?? 5, 20); // Hard cap 20
    const dir = params.direction || (strategy === "Ancestor" ? "incoming" : strategy === "Descendant" ? "outgoing" : "both");

    const execMode = this.planner.selectExecutionStrategy({ ...params, maxDepth });

    if (execMode === "CACHE" && this.cache) {
      const cachedEdges = this.cache.get(params.tenantId, params.workspaceId, params.startNodeId, maxDepth);
      if (cachedEdges) {
        const nodesMap: Record<string, CanonicalKnowledgeObject> = {};
        if (params.includeNodes && this.knowledgeRepository) {
          const nodeIds = new Set<string>([params.startNodeId]);
          cachedEdges.forEach((e) => {
            nodeIds.add(e.sourceId);
            nodeIds.add(e.targetId);
          });
          for (const nid of nodeIds) {
            const obj = await this.knowledgeRepository.findById(nid);
            if (obj) nodesMap[nid] = obj;
          }
        }
        return new Subgraph({
          nodes: nodesMap,
          edges: cachedEdges,
          metadata: {
            nodeCount: Object.keys(nodesMap).length,
            edgeCount: cachedEdges.length,
            depthReached: maxDepth,
            truncated: false,
            executionTimeMs: Date.now() - startTime,
          },
        });
      }
    }

    // Iterative Indexed Traversal (BFS / DFS)
    const visitedEdges = new Map<string, GraphEdgeData>();
    const visitedNodes = new Set<string>([params.startNodeId]);
    const queue: Array<{ nodeId: string; currentDepth: number }> = [{ nodeId: params.startNodeId, currentDepth: 0 }];

    let maxReachedDepth = 0;

    while (queue.length > 0) {
      const { nodeId, currentDepth } = strategy === "DFS" ? queue.pop()! : queue.shift()!;
      if (currentDepth >= maxDepth) continue;

      const neighbors = await this.graphRepository.getNeighbors(nodeId, {
        tenantId: params.tenantId,
        workspaceId: params.workspaceId,
        relationTypes: params.relationTypes,
        direction: dir,
      });

      for (const edge of neighbors) {
        if (!visitedEdges.has(edge.id)) {
          visitedEdges.set(edge.id, edge.toJSON());
        }

        const nextNodeId = edge.sourceId === nodeId ? edge.targetId : edge.sourceId;
        if (!visitedNodes.has(nextNodeId)) {
          visitedNodes.add(nextNodeId);
          maxReachedDepth = Math.max(maxReachedDepth, currentDepth + 1);
          queue.push({ nodeId: nextNodeId, currentDepth: currentDepth + 1 });
        }
      }
    }

    const resultEdges = Array.from(visitedEdges.values());

    if (this.cache && maxDepth <= 2) {
      this.cache.set(params.tenantId, params.workspaceId, params.startNodeId, maxDepth, resultEdges);
    }

    const nodesMap: Record<string, CanonicalKnowledgeObject> = {};
    if (params.includeNodes && this.knowledgeRepository) {
      for (const nid of visitedNodes) {
        const obj = await this.knowledgeRepository.findById(nid);
        if (obj) nodesMap[nid] = obj;
      }
    }

    return new Subgraph({
      nodes: nodesMap,
      edges: resultEdges,
      metadata: {
        nodeCount: visitedNodes.size,
        edgeCount: resultEdges.length,
        depthReached: maxReachedDepth,
        truncated: false,
        executionTimeMs: Date.now() - startTime,
      },
    });
  }

  async findShortestPath(
    tenantId: string,
    workspaceId: string,
    startNodeId: string,
    targetNodeId: string,
    relationTypes?: StandardRelationshipType[]
  ): Promise<PathResult> {
    if (startNodeId === targetNodeId) {
      return { found: true, pathNodes: [startNodeId], edges: [], depth: 0 };
    }

    const queue: Array<{ nodeId: string; path: string[]; edges: GraphEdgeData[] }> = [
      { nodeId: startNodeId, path: [startNodeId], edges: [] },
    ];
    const visited = new Set<string>([startNodeId]);

    while (queue.length > 0) {
      const { nodeId, path, edges } = queue.shift()!;

      if (nodeId === targetNodeId) {
        return {
          found: true,
          pathNodes: path,
          edges,
          depth: edges.length,
        };
      }

      const neighbors = await this.graphRepository.getNeighbors(nodeId, {
        tenantId,
        workspaceId,
        relationTypes,
        direction: "outgoing",
      });

      for (const edge of neighbors) {
        if (!visited.has(edge.targetId)) {
          visited.add(edge.targetId);
          queue.push({
            nodeId: edge.targetId,
            path: [...path, edge.targetId],
            edges: [...edges, edge.toJSON()],
          });
        }
      }
    }

    return { found: false, pathNodes: [], edges: [], depth: -1 };
  }
}
