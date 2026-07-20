import { ViewDefinition, LayoutType } from "../../domain/entities/view-definition";
import { CanonicalViewModel, ResolvedColumn, ViewItem, ViewItemGroup } from "../../domain/entities/canonical-view-model";
import { ILayoutAdapter } from "../../domain/ports/view-registry.port";
import { GroupSpecification } from "../../domain/ast/group-ast";

export abstract class BaseLayoutAdapter implements ILayoutAdapter {
  abstract layoutType: LayoutType;

  abstract project(
    items: any[],
    edges: any[],
    definition: ViewDefinition,
    options?: Record<string, any>
  ): CanonicalViewModel;

  protected resolveColumns(definition: ViewDefinition): ResolvedColumn[] {
    return (definition.columns || []).map((col) => ({
      key: col.key,
      label: col.label,
      type: "string",
      width: col.width,
      sortable: col.sortable ?? true,
      filterable: col.filterable ?? true,
    }));
  }

  protected mapToViewItems(items: any[]): ViewItem[] {
    return items.map((item) => ({
      id: item.id || item._id,
      type: item.type || item.objectTypeId || "KnowledgeObject",
      title: item.title || item.name || "Untitled",
      summary: item.summary || item.description,
      properties: item.properties || {},
      metadata: item.metadata || {},
      labels: item.labels || [],
      status: item.status || item.properties?.status || "open",
      createdAt: item.createdAt || Date.now(),
      updatedAt: item.updatedAt || Date.now(),
      parentId: item.parentId || item.properties?.parentId,
      depth: item.depth || 0,
      displayMeta: item.displayMeta || {},
    }));
  }

  protected buildGroups(
    viewItems: ViewItem[],
    groupSpecs?: GroupSpecification
  ): ViewItemGroup[] {
    if (!groupSpecs || groupSpecs.length === 0) {
      return [
        {
          id: "group_all",
          key: "all",
          label: "All Items",
          count: viewItems.length,
          items: viewItems,
        },
      ];
    }

    const primaryGroup = groupSpecs[0];
    if (!primaryGroup) return [];
    const fieldKey = primaryGroup.field;
    const groupMap = new Map<string, ViewItem[]>();

    for (const item of viewItems) {
      const groupVal = String(
        item.properties?.[fieldKey] ?? item[fieldKey as keyof ViewItem] ?? "Unassigned"
      );
      if (!groupMap.has(groupVal)) {
        groupMap.set(groupVal, []);
      }
      groupMap.get(groupVal)!.push(item);
    }

    const groups: ViewItemGroup[] = [];
    for (const [key, items] of groupMap.entries()) {
      groups.push({
        id: `group_${key.toLowerCase().replace(/\s+/g, "_")}`,
        key,
        label: key,
        count: items.length,
        items,
        aggregates: { count: items.length },
      });
    }

    return groups;
  }
}
