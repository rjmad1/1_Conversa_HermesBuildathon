import type { GraphQueryAstV1 } from "../domain/query-ast";
import { GraphQueryBuilder } from "../domain/query-ast";
import type { Subgraph } from "../domain/entities/subgraph";
import type { TraversalEngine } from "./traversal-engine";
import type { IKnowledgeRepository } from "../../knowledge/repository";

export class GraphQueryOptimizer {
  optimize(ast: GraphQueryAstV1): GraphQueryAstV1 {
    const clone: GraphQueryAstV1 = JSON.parse(JSON.stringify(ast));
    // Enforce safety limits
    if (clone.traversal.maxDepth > 20) clone.traversal.maxDepth = 20;
    if (clone.options?.limit && clone.options.limit > 1000) clone.options.limit = 1000;
    return clone;
  }
}

export class GraphQueryService {
  private optimizer = new GraphQueryOptimizer();

  constructor(
    private traversalEngine: TraversalEngine,
    private knowledgeRepository?: IKnowledgeRepository
  ) {}

  async executeQuery(queryAst: GraphQueryAstV1 | string | object): Promise<Subgraph> {
    const ast = typeof queryAst === "string" || !("version" in (queryAst as object))
      ? GraphQueryBuilder.fromJson(queryAst)
      : (queryAst as GraphQueryAstV1);

    const optimized = this.optimizer.optimize(ast);

    const startId = optimized.start.nodeId || (optimized.start.nodeIds && optimized.start.nodeIds[0]) || "";

    const subgraph = await this.traversalEngine.traverse({
      tenantId: optimized.tenantId,
      workspaceId: optimized.workspaceId,
      startNodeId: startId,
      strategy: optimized.traversal.strategy,
      direction: optimized.traversal.direction,
      maxDepth: optimized.traversal.maxDepth,
      relationTypes: optimized.traversal.relationTypes,
      includeNodes: optimized.options?.includeNodes ?? true,
    });

    // Apply target type filters if specified
    if (optimized.filters?.targetNodeTypes && optimized.filters.targetNodeTypes.length > 0) {
      const allowedTypes = new Set(optimized.filters.targetNodeTypes);
      const filteredNodes = new Map();
      const filteredEdges = [];

      for (const [nid, node] of subgraph.nodes.entries()) {
        if (allowedTypes.has(node.type as any)) {
          filteredNodes.set(nid, node);
        }
      }

      for (const edge of subgraph.edges) {
        if (filteredNodes.has(edge.sourceId) || filteredNodes.has(edge.targetId)) {
          filteredEdges.push(edge);
        }
      }

      return new (subgraph.constructor as any)({
        nodes: Object.fromEntries(filteredNodes),
        edges: filteredEdges,
        metadata: {
          ...subgraph.metadata,
          nodeCount: filteredNodes.size,
          edgeCount: filteredEdges.length,
        },
      });
    }

    return subgraph;
  }
}
