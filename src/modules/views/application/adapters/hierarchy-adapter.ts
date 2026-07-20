import { BaseLayoutAdapter } from "./base-adapter";
import { ViewDefinition, LayoutType } from "../../domain/entities/view-definition";
import { CanonicalViewModel } from "../../domain/entities/canonical-view-model";

export class HierarchyLayoutAdapter extends BaseLayoutAdapter {
  layoutType: LayoutType = "hierarchy";

  project(
    items: any[],
    edges: any[],
    definition: ViewDefinition,
    options?: Record<string, any>
  ): CanonicalViewModel {
    const rawViewItems = this.mapToViewItems(items);

    // Build parent-child hierarchy map based on parentId or edges
    const parentChildMap = new Map<string, string[]>();
    for (const edge of edges) {
      if (!parentChildMap.has(edge.sourceId)) {
        parentChildMap.set(edge.sourceId, []);
      }
      parentChildMap.get(edge.sourceId)!.push(edge.targetId);
    }

    const annotatedItems = rawViewItems.map((item) => ({
      ...item,
      depth: item.depth || 0,
      displayMeta: {
        ...item.displayMeta,
        childIds: parentChildMap.get(item.id) || [],
      },
    }));

    const columns = this.resolveColumns(definition);
    const groups = this.buildGroups(annotatedItems, options?.groupSpec);

    return {
      viewId: definition.id,
      viewName: definition.name,
      layoutType: "hierarchy",
      metadata: {
        totalCount: options?.totalCount ?? annotatedItems.length,
        filteredCount: options?.filteredCount ?? annotatedItems.length,
        resolvedAt: Date.now(),
        executionMode: options?.executionMode || "analytical",
      },
      columns,
      groups,
      items: annotatedItems,
      relationships: edges,
      aggregates: { nodeCount: annotatedItems.length, edgeCount: edges.length },
      pagination: {
        startIndex: options?.offset || 0,
        pageSize: options?.limit || 100,
        hasMore: false,
      },
      layoutHints: {
        indentSize: 24,
        expandable: true,
      },
    };
  }
}
