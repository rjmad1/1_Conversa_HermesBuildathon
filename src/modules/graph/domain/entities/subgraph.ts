import type { CanonicalKnowledgeObject } from "../../../../shared/domain/types";
import type { GraphEdgeData } from "../types";

export interface SubgraphMetadata {
  nodeCount: number;
  edgeCount: number;
  depthReached: number;
  truncated: boolean;
  executionTimeMs?: number;
}

export interface SubgraphData {
  nodes: Record<string, CanonicalKnowledgeObject>;
  edges: GraphEdgeData[];
  metadata: SubgraphMetadata;
}

export class Subgraph {
  readonly nodes: Map<string, CanonicalKnowledgeObject>;
  readonly edges: GraphEdgeData[];
  readonly metadata: SubgraphMetadata;

  constructor(data: SubgraphData) {
    this.nodes = new Map(Object.entries(data.nodes));
    this.edges = [...data.edges];
    this.metadata = { ...data.metadata };
  }

  static empty(): Subgraph {
    return new Subgraph({
      nodes: {},
      edges: [],
      metadata: { nodeCount: 0, edgeCount: 0, depthReached: 0, truncated: false },
    });
  }

  toJSON(): SubgraphData {
    const nodesObj: Record<string, CanonicalKnowledgeObject> = {};
    for (const [key, val] of this.nodes.entries()) {
      nodesObj[key] = val;
    }
    return {
      nodes: nodesObj,
      edges: this.edges,
      metadata: this.metadata,
    };
  }
}
