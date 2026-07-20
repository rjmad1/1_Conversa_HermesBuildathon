import { BaseLayoutAdapter } from "./base-adapter";
import { ViewDefinition, LayoutType } from "../../domain/entities/view-definition";
import { CanonicalViewModel } from "../../domain/entities/canonical-view-model";

export class CalendarLayoutAdapter extends BaseLayoutAdapter {
  layoutType: LayoutType = "calendar";

  project(
    items: any[],
    edges: any[],
    definition: ViewDefinition,
    options?: Record<string, any>
  ): CanonicalViewModel {
    const viewItems = this.mapToViewItems(items).map((item) => {
      const dateVal = item.properties?.scheduledAt || item.properties?.dueDate || item.createdAt;
      return {
        ...item,
        displayMeta: {
          ...item.displayMeta,
          eventDate: dateVal,
          eventIso: new Date(dateVal).toISOString(),
        },
      };
    });

    const columns = this.resolveColumns(definition);
    const groups = this.buildGroups(viewItems, options?.groupSpec);

    return {
      viewId: definition.id,
      viewName: definition.name,
      layoutType: "calendar",
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
      aggregates: { eventCount: viewItems.length },
      pagination: {
        startIndex: options?.offset || 0,
        pageSize: options?.limit || 100,
        hasMore: false,
      },
      layoutHints: {
        defaultViewMode: "month",
        dateField: "scheduledAt",
      },
    };
  }
}
