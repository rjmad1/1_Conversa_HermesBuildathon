import type { Subgraph } from "../domain/entities/subgraph";

export type VisualizationLayoutType = "force" | "hierarchy" | "tree" | "mindmap" | "timeline" | "network";

export interface VisualizationNode {
  id: string;
  label: string;
  type: string;
  group?: string;
  timestamp?: number;
  properties?: Record<string, any>;
}

export interface VisualizationLink {
  source: string;
  target: string;
  relationType: string;
  label: string;
}

export interface VisualizationPayload {
  layout: VisualizationLayoutType;
  nodes: VisualizationNode[];
  links: VisualizationLink[];
  rootNodeId?: string;
}

export class VisualizationLayoutAdapters {
  static toForceGraph(subgraph: Subgraph): VisualizationPayload {
    const nodes: VisualizationNode[] = [];
    const links: VisualizationLink[] = [];

    for (const [id, obj] of subgraph.nodes.entries()) {
      nodes.push({
        id,
        label: obj.title,
        type: obj.type,
        group: obj.type,
        properties: obj.properties,
      });
    }

    for (const edge of subgraph.edges) {
      links.push({
        source: edge.sourceId,
        target: edge.targetId,
        relationType: edge.relationType,
        label: edge.relationType,
      });
    }

    return { layout: "force", nodes, links };
  }

  static toHierarchy(subgraph: Subgraph, rootNodeId?: string): VisualizationPayload {
    const payload = VisualizationLayoutAdapters.toForceGraph(subgraph);
    return {
      ...payload,
      layout: "hierarchy",
      rootNodeId,
    };
  }

  static toTree(subgraph: Subgraph, rootNodeId?: string): VisualizationPayload {
    const payload = VisualizationLayoutAdapters.toForceGraph(subgraph);
    return {
      ...payload,
      layout: "tree",
      rootNodeId,
    };
  }

  static toMindMap(subgraph: Subgraph, rootNodeId?: string): VisualizationPayload {
    const payload = VisualizationLayoutAdapters.toForceGraph(subgraph);
    return {
      ...payload,
      layout: "mindmap",
      rootNodeId,
    };
  }

  static toTimeline(subgraph: Subgraph): VisualizationPayload {
    const nodes: VisualizationNode[] = [];
    const links: VisualizationLink[] = [];

    for (const [id, obj] of subgraph.nodes.entries()) {
      nodes.push({
        id,
        label: obj.title,
        type: obj.type,
        group: obj.type,
        timestamp: obj.createdAt,
        properties: obj.properties,
      });
    }

    // Sort nodes chronologically
    nodes.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    for (const edge of subgraph.edges) {
      links.push({
        source: edge.sourceId,
        target: edge.targetId,
        relationType: edge.relationType,
        label: edge.relationType,
      });
    }

    return { layout: "timeline", nodes, links };
  }
}
