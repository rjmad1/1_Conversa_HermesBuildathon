import { BaseLayoutAdapter } from "./base-adapter";
import { ViewDefinition, LayoutType } from "../../domain/entities/view-definition";
import { CanonicalViewModel } from "../../domain/entities/canonical-view-model";

export class TimelineLayoutAdapter extends BaseLayoutAdapter {
  layoutType: LayoutType = "timeline";

  project(
    items: any[],
    edges: any[],
    definition: ViewDefinition,
    options?: Record<string, any>
  ): CanonicalViewModel {
    const viewItems = this.mapToViewItems(items).map((item) => {
      const startMs = item.properties?.scheduledAt || item.createdAt;
      const endMs = item.properties?.dueDate || startMs + 60 * 60 * 1000;
      return {
        ...item,
        displayMeta: {
          ...item.displayMeta,
          startMs,
          endMs,
        },
      };
    });

    const columns = this.resolveColumns(definition);
    const groups = this.buildGroups(viewItems, options?.groupSpec);

    return {
      viewId: definition.id,
      viewName: definition.name,
      layoutType: "timeline",
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
      aggregates: { trackCount: groups.length },
      pagination: {
        startIndex: options?.offset || 0,
        pageSize: options?.limit || 100,
        hasMore: false,
      },
      layoutHints: {
        granularity: "day",
        showDependencies: true,
      },
    };
  }
}
