import { BreadcrumbNode, ParentChainNode, GraphNeighborNode } from "../../domain/entities/canonical-context";
import { ContextProfileConfig } from "../../domain/profiles/context-profile";

export class BreadcrumbProvider {
  public resolveBreadcrumbs(rootItem: any, itemsById: Map<string, any>): BreadcrumbNode[] {
    const breadcrumbs: BreadcrumbNode[] = [
      {
        id: rootItem.id || rootItem._id,
        title: rootItem.title || rootItem.name || "Untitled",
        type: rootItem.type || rootItem.objectTypeId || "KnowledgeObject",
      },
    ];

    let current = rootItem;
    let depth = 0;
    while (current && current.parentId && depth < 5) {
      const parent = itemsById.get(current.parentId);
      if (!parent) break;
      breadcrumbs.unshift({
        id: parent.id || parent._id,
        title: parent.title || parent.name || "Untitled",
        type: parent.type || parent.objectTypeId || "KnowledgeObject",
      });
      current = parent;
      depth++;
    }

    return breadcrumbs;
  }
}

export class ParentChainProvider {
  public resolveParentChain(rootItem: any, edges: any[], itemsById: Map<string, any>): ParentChainNode[] {
    const parents: ParentChainNode[] = [];
    const incoming = edges.filter((e) => e.targetId === (rootItem.id || rootItem._id));

    for (const edge of incoming) {
      const parentItem = itemsById.get(edge.sourceId);
      if (parentItem) {
        parents.push({
          id: parentItem.id || parentItem._id,
          title: parentItem.title || parentItem.name || "Untitled",
          relationType: edge.relationType || "parent_of",
        });
      }
    }

    return parents;
  }
}

export class NeighborhoodProvider {
  public resolveNeighborhood(
    rootItem: any,
    edges: any[],
    itemsById: Map<string, any>,
    profile: ContextProfileConfig
  ): GraphNeighborNode[] {
    const rootId = rootItem.id || rootItem._id;
    const neighbors: GraphNeighborNode[] = [];
    const visited = new Set<string>([rootId]);

    const queue: Array<{ id: string; distance: number }> = [{ id: rootId, distance: 0 }];

    while (queue.length > 0) {
      const { id, distance } = queue.shift()!;
      if (distance >= profile.maxDepth) continue;

      const connectedEdges = edges.filter((e) => e.sourceId === id || e.targetId === id);
      for (const edge of connectedEdges) {
        const neighborId = edge.sourceId === id ? edge.targetId : edge.sourceId;
        if (visited.has(neighborId)) continue;
        visited.add(neighborId);

        const item = itemsById.get(neighborId);
        if (item) {
          neighbors.push({
            id: item.id || item._id,
            title: item.title || item.name || "Untitled",
            type: item.type || item.objectTypeId || "KnowledgeObject",
            distance: distance + 1,
            relationType: edge.relationType || "related_to",
          });
          queue.push({ id: neighborId, distance: distance + 1 });
        }
      }
    }

    return neighbors;
  }
}

export class RelationshipSummaryProvider {
  public resolveSummary(rootItem: any, edges: any[]): Record<string, number> {
    const rootId = rootItem.id || rootItem._id;
    const summary: Record<string, number> = {};

    const relevant = edges.filter((e) => e.sourceId === rootId || e.targetId === rootId);
    for (const edge of relevant) {
      const type = edge.relationType || "related_to";
      summary[type] = (summary[type] || 0) + 1;
    }

    return summary;
  }
}
