import { BaseLayoutAdapter } from "./base-adapter";
import { ViewDefinition, LayoutType } from "../../domain/entities/view-definition";
import { CanonicalViewModel } from "../../domain/entities/canonical-view-model";

export class NetworkLayoutAdapter extends BaseLayoutAdapter {
  layoutType: LayoutType = "network";

  project(
    items: any[],
    edges: any[],
    definition: ViewDefinition,
    options?: Record<string, any>
  ): CanonicalViewModel {
    const rawViewItems = this.mapToViewItems(items);
    const columns = this.resolveColumns(definition);
    const groups = this.buildGroups(rawViewItems, options?.groupSpec);

    const mappedEdges = edges.map((e) => ({
      id: e.id || `${e.sourceId}_${e.targetId}`,
      sourceId: e.sourceId,
      targetId: e.targetId,
      relationType: e.relationType,
      metadata: e.metadata || {},
    }));

    return {
      viewId: definition.id,
      viewName: definition.name,
      layoutType: "network",
      metadata: {
        totalCount: options?.totalCount ?? rawViewItems.length,
        filteredCount: options?.filteredCount ?? rawViewItems.length,
        resolvedAt: Date.now(),
        executionMode: options?.executionMode || "analytical",
      },
      columns,
      groups,
      items: rawViewItems,
      relationships: mappedEdges,
      aggregates: { nodeCount: rawViewItems.length, edgeCount: mappedEdges.length },
      pagination: {
        startIndex: options?.offset || 0,
        pageSize: options?.limit || 100,
        hasMore: false,
      },
      layoutHints: {
        graphLayout: "force-directed",
        physicsEnabled: true,
      },
    };
  }
}
