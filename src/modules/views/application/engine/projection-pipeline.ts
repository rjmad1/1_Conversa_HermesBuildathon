import { ViewDefinition } from "../../domain/entities/view-definition";
import { CanonicalViewModel } from "../../domain/entities/canonical-view-model";
import { FilterExpression } from "../../domain/ast/filter-ast";
import { SortSpecification } from "../../domain/ast/sort-ast";
import { GroupSpecification } from "../../domain/ast/group-ast";
import { ExecutionPlan } from "./projection-planner";
import { IViewRegistry } from "../../domain/ports/view-registry.port";

export class ProjectionPipeline {
  constructor(private registry: IViewRegistry) {}

  public execute(
    plan: ExecutionPlan,
    definition: ViewDefinition,
    rawItems: any[],
    rawEdges: any[] = []
  ): CanonicalViewModel {
    // 1. Permission & Property Extraction / Normalization
    let items = rawItems.map((item) => this.normalizeItem(item));

    // 2. Filter Evaluation
    if (plan.normalizedAST.filter) {
      items = items.filter((item) =>
        this.evaluateFilter(item, plan.normalizedAST.filter!)
      );
    }

    // 3. Sorting
    if (plan.normalizedAST.sort && plan.normalizedAST.sort.length > 0) {
      items = this.applySort(items, plan.normalizedAST.sort);
    }

    // 4. Pagination Windowing
    const totalCount = rawItems.length;
    const filteredCount = items.length;
    const offset = plan.normalizedAST.pagination?.offset || 0;
    const limit = plan.normalizedAST.pagination?.limit || 100;
    const windowedItems = items.slice(offset, offset + limit);

    // 5. Delegate to Layout Adapter
    const adapter = this.registry.getAdapter(definition.layoutType);
    const viewModel = adapter.project(windowedItems, rawEdges, definition, {
      totalCount,
      filteredCount,
      executionMode: plan.executionMode,
      groupSpec: plan.normalizedAST.group,
      offset,
      limit,
    });

    return viewModel;
  }

  private normalizeItem(raw: any): any {
    return {
      id: raw.id || raw._id,
      type: raw.type || raw.objectTypeId || "KnowledgeObject",
      title: raw.title || raw.name || "Untitled",
      summary: raw.summary || raw.description,
      properties: raw.properties || {},
      metadata: raw.metadata || {},
      labels: raw.labels || [],
      status: raw.status || raw.properties?.status || "open",
      createdAt: raw.createdAt || Date.now(),
      updatedAt: raw.updatedAt || Date.now(),
      ...raw,
    };
  }

  private evaluateFilter(item: any, filter: FilterExpression): boolean {
    switch (filter.type) {
      case "property": {
        const val = item.properties?.[filter.fieldKey] ?? item[filter.fieldKey];
        return this.compareValues(val, filter.operator, filter.value);
      }
      case "metadata": {
        const val = item.metadata?.[filter.metadataKey];
        return this.compareValues(val, filter.operator, filter.value);
      }
      case "date": {
        const val = item[filter.fieldKey] || item.properties?.[filter.fieldKey];
        return this.evaluateDateFilter(val, filter.operator, filter.value);
      }
      case "logical": {
        if (filter.operator === "AND") {
          return filter.expressions.every((e) => this.evaluateFilter(item, e));
        } else if (filter.operator === "OR") {
          return filter.expressions.some((e) => this.evaluateFilter(item, e));
        } else if (filter.operator === "NOT") {
          return !filter.expressions.some((e) => this.evaluateFilter(item, e));
        }
        return true;
      }
      default:
        return true;
    }
  }

  private compareValues(val: any, op: string, targetVal: any): boolean {
    switch (op) {
      case "eq":
        return val === targetVal;
      case "neq":
        return val !== targetVal;
      case "gt":
        return val > targetVal;
      case "gte":
        return val >= targetVal;
      case "lt":
        return val < targetVal;
      case "lte":
        return val <= targetVal;
      case "contains":
        return String(val || "").toLowerCase().includes(String(targetVal || "").toLowerCase());
      case "not_contains":
        return !String(val || "").toLowerCase().includes(String(targetVal || "").toLowerCase());
      case "is_empty":
        return val === undefined || val === null || val === "";
      case "is_not_empty":
        return val !== undefined && val !== null && val !== "";
      case "in":
        return Array.isArray(targetVal) && targetVal.includes(val);
      default:
        return true;
    }
  }

  private evaluateDateFilter(dateVal: any, op: string, rangeObj?: any): boolean {
    if (!dateVal) return false;
    const time = typeof dateVal === "number" ? dateVal : new Date(dateVal).getTime();
    if (isNaN(time)) return false;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    switch (op) {
      case "today":
        return time >= todayStart && time < todayEnd;
      case "this_week": {
        const weekStart = todayStart - now.getDay() * 24 * 60 * 60 * 1000;
        return time >= weekStart;
      }
      case "last_n_days": {
        const days = rangeObj?.days || 7;
        const nDaysAgo = Date.now() - days * 24 * 60 * 60 * 1000;
        return time >= nDaysAgo;
      }
      default:
        return true;
    }
  }

  private applySort(items: any[], sortSpecs: SortSpecification): any[] {
    return [...items].sort((a, b) => {
      for (const spec of sortSpecs) {
        const valA = a.properties?.[spec.field] ?? a[spec.field];
        const valB = b.properties?.[spec.field] ?? b[spec.field];

        if (valA === valB) continue;
        if (valA === undefined || valA === null) return spec.nullsFirst ? -1 : 1;
        if (valB === undefined || valB === null) return spec.nullsFirst ? 1 : -1;

        const comp = valA < valB ? -1 : 1;
        return spec.direction === "asc" ? comp : -comp;
      }
      return 0;
    });
  }
}
