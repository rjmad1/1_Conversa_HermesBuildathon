import { BaseLayoutAdapter } from "./base-adapter";
import { ViewDefinition, LayoutType } from "../../domain/entities/view-definition";
import { CanonicalViewModel } from "../../domain/entities/canonical-view-model";

export class TreeLayoutAdapter extends BaseLayoutAdapter {
  layoutType: LayoutType = "tree";

  project(
    items: any[],
    edges: any[],
    definition: ViewDefinition,
    options?: Record<string, any>
  ): CanonicalViewModel {
    const rawViewItems = this.mapToViewItems(items);
    const columns = this.resolveColumns(definition);
    const groups = this.buildGroups(rawViewItems, options?.groupSpec);

    return {
      viewId: definition.id,
      viewName: definition.name,
      layoutType: "tree",
      metadata: {
        totalCount: options?.totalCount ?? rawViewItems.length,
        filteredCount: options?.filteredCount ?? rawViewItems.length,
        resolvedAt: Date.now(),
        executionMode: options?.executionMode || "analytical",
      },
      columns,
      groups,
      items: rawViewItems,
      relationships: edges,
      aggregates: { totalNodes: rawViewItems.length },
      pagination: {
        startIndex: options?.offset || 0,
        pageSize: options?.limit || 100,
        hasMore: false,
      },
      layoutHints: {
        treeOrientation: "vertical",
        collapsible: true,
      },
    };
  }
}
