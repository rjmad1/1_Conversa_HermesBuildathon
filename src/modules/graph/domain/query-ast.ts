import type { StandardRelationshipType } from "./types";
import type { KnowledgeObjectType } from "../../../shared/domain/types";

export interface GraphQueryAstV1 {
  version: 1;
  tenantId: string;
  workspaceId: string;
  start: {
    nodeId?: string;
    nodeIds?: string[];
    nodeTypes?: KnowledgeObjectType[];
  };
  traversal: {
    strategy: "BFS" | "DFS" | "Ancestor" | "Descendant" | "Neighborhood" | "ShortestPath";
    direction: "outgoing" | "incoming" | "both";
    maxDepth: number;
    relationTypes?: StandardRelationshipType[];
    targetNodeId?: string; // For ShortestPath
  };
  filters?: {
    targetNodeTypes?: KnowledgeObjectType[];
    edgeMetadataMatch?: Record<string, any>;
    excludeNodeIds?: string[];
  };
  options?: {
    includeNodes?: boolean;
    limit?: number;
    offset?: number;
  };
}

export class GraphQueryBuilder {
  private ast: GraphQueryAstV1;

  constructor(tenantId: string, workspaceId: string) {
    this.ast = {
      version: 1,
      tenantId,
      workspaceId,
      start: {},
      traversal: {
        strategy: "BFS",
        direction: "outgoing",
        maxDepth: 3,
      },
      filters: {},
      options: {
        includeNodes: true,
        limit: 100,
      },
    };
  }

  static init(tenantId: string, workspaceId: string): GraphQueryBuilder {
    return new GraphQueryBuilder(tenantId, workspaceId);
  }

  fromNode(nodeId: string): this {
    this.ast.start.nodeId = nodeId;
    return this;
  }

  fromNodes(nodeIds: string[]): this {
    this.ast.start.nodeIds = nodeIds;
    return this;
  }

  fromNodeTypes(types: KnowledgeObjectType[]): this {
    this.ast.start.nodeTypes = types;
    return this;
  }

  strategy(strategy: GraphQueryAstV1["traversal"]["strategy"]): this {
    this.ast.traversal.strategy = strategy;
    return this;
  }

  direction(direction: GraphQueryAstV1["traversal"]["direction"]): this {
    this.ast.traversal.direction = direction;
    return this;
  }

  maxDepth(depth: number): this {
    this.ast.traversal.maxDepth = depth;
    return this;
  }

  viaRelations(relations: StandardRelationshipType[]): this {
    this.ast.traversal.relationTypes = relations;
    return this;
  }

  targetNodeId(targetId: string): this {
    this.ast.traversal.targetNodeId = targetId;
    return this;
  }

  whereTargetType(types: KnowledgeObjectType[]): this {
    if (!this.ast.filters) this.ast.filters = {};
    this.ast.filters.targetNodeTypes = types;
    return this;
  }

  whereEdgeMetadata(metadataMatch: Record<string, any>): this {
    if (!this.ast.filters) this.ast.filters = {};
    this.ast.filters.edgeMetadataMatch = metadataMatch;
    return this;
  }

  includeNodes(include: boolean): this {
    if (!this.ast.options) this.ast.options = {};
    this.ast.options.includeNodes = include;
    return this;
  }

  limit(limit: number): this {
    if (!this.ast.options) this.ast.options = {};
    this.ast.options.limit = limit;
    return this;
  }

  buildAst(): GraphQueryAstV1 {
    return JSON.parse(JSON.stringify(this.ast));
  }

  static fromJson(json: string | object): GraphQueryAstV1 {
    const obj = typeof json === "string" ? JSON.parse(json) : json;
    if (!obj || obj.version !== 1) {
      throw new Error("Invalid Graph Query AST version or format.");
    }
    return obj as GraphQueryAstV1;
  }
}
