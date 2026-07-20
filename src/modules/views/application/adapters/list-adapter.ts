import { BaseLayoutAdapter } from "./base-adapter";
import { ViewDefinition, LayoutType } from "../../domain/entities/view-definition";
import { CanonicalViewModel } from "../../domain/entities/canonical-view-model";

export class ListLayoutAdapter extends BaseLayoutAdapter {
  layoutType: LayoutType = "list";

  project(
    items: any[],
    edges: any[],
    definition: ViewDefinition,
    options?: Record<string, any>
  ): CanonicalViewModel {
    const viewItems = this.mapToViewItems(items);
    const columns = this.resolveColumns(definition);
    const groups = this.buildGroups(viewItems, options?.groupSpec);

    return {
      viewId: definition.id,
      viewName: definition.name,
      layoutType: "list",
      metadata: {
        totalCount: options?.totalCount ?? viewItems.length,
        filteredCount: options?.filteredCount ?? viewItems.length,
        resolvedAt: Date.now(),
        executionMode: options?.executionMode || "interactive",
      },
      columns,
      groups,
      items: viewItems,
      relationships: edges,
      aggregates: { count: viewItems.length },
      pagination: {
        startIndex: options?.offset || 0,
        pageSize: options?.limit || 100,
        hasMore: (options?.offset || 0) + viewItems.length < (options?.totalCount || 0),
      },
      layoutHints: {
        density: "comfortable",
        showSummaries: true,
      },
    };
  }
}
