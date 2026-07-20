import { CoreQueryPredicate, CoreQueryAST, SortSpecification } from "./ast";

export class CoreQueryCompiler {
  /**
   * Evaluates a predicate against a raw or normalized item object.
   */
  public evaluate(item: any, predicate: CoreQueryPredicate): boolean {
    if (!predicate) return true;

    switch (predicate.type) {
      case "property": {
        const val = item.properties?.[predicate.fieldKey] ?? item[predicate.fieldKey];
        return this.compareValues(val, predicate.operator, predicate.value);
      }
      case "metadata": {
        const val = item.metadata?.[predicate.metadataKey];
        return this.compareValues(val, predicate.operator, predicate.value);
      }
      case "relationship": {
        const rels = item.relationships || [];
        if (predicate.operator === "has_relationship") {
          return rels.some(
            (r: any) =>
              r.relationType === predicate.relationType &&
              (!predicate.targetId || r.targetId === predicate.targetId)
          );
        } else if (predicate.operator === "count_gt") {
          const matching = rels.filter((r: any) => r.relationType === predicate.relationType);
          return matching.length > (predicate.value || 0);
        } else if (predicate.operator === "count_eq") {
          const matching = rels.filter((r: any) => r.relationType === predicate.relationType);
          return matching.length === (predicate.value || 0);
        }
        return true;
      }
      case "date": {
        const val = item[predicate.fieldKey] || item.properties?.[predicate.fieldKey];
        return this.evaluateDate(val, predicate.operator, predicate.value);
      }
      case "logical": {
        if (predicate.operator === "AND") {
          return predicate.expressions.every((expr) => this.evaluate(item, expr));
        } else if (predicate.operator === "OR") {
          return predicate.expressions.some((expr) => this.evaluate(item, expr));
        } else if (predicate.operator === "NOT") {
          return !predicate.expressions.some((expr) => this.evaluate(item, expr));
        }
        return true;
      }
      default:
        return true;
    }
  }

  /**
   * Applies object type filtering, predicate evaluation, sorting, and pagination to an array of items.
   */
  public execute(ast: CoreQueryAST, items: any[]): { items: any[]; totalCount: number } {
    let filtered = items;

    // 1. Filter by target object types if specified
    if (ast.objectTypes && ast.objectTypes.length > 0) {
      filtered = filtered.filter((item) => ast.objectTypes!.includes(item.type || item.objectTypeId));
    }

    // 2. Evaluate Core Query Predicate
    if (ast.predicate) {
      filtered = filtered.filter((item) => this.evaluate(item, ast.predicate!));
    }

    const totalCount = filtered.length;

    // 3. Apply Sort
    if (ast.sort && ast.sort.length > 0) {
      filtered = this.applySort(filtered, ast.sort);
    }

    // 4. Apply Pagination
    const offset = ast.pagination?.offset || 0;
    const limit = ast.pagination?.limit || 100;
    const paginated = filtered.slice(offset, offset + limit);

    return { items: paginated, totalCount };
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
      case "starts_with":
        return String(val || "").toLowerCase().startsWith(String(targetVal || "").toLowerCase());
      case "ends_with":
        return String(val || "").toLowerCase().endsWith(String(targetVal || "").toLowerCase());
      case "is_empty":
        return val === undefined || val === null || val === "";
      case "is_not_empty":
        return val !== undefined && val !== null && val !== "";
      case "in":
        return Array.isArray(targetVal) && targetVal.includes(val);
      case "not_in":
        return Array.isArray(targetVal) && !targetVal.includes(val);
      default:
        return true;
    }
  }

  private evaluateDate(dateVal: any, op: string, rangeObj?: any): boolean {
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
      case "this_month": {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        return time >= monthStart;
      }
      case "last_n_days": {
        const days = rangeObj?.days || 7;
        const nDaysAgo = Date.now() - days * 24 * 60 * 60 * 1000;
        return time >= nDaysAgo;
      }
      case "custom_range": {
        if (!rangeObj) return true;
        const startMs = rangeObj.start ? new Date(rangeObj.start).getTime() : 0;
        const endMs = rangeObj.end ? new Date(rangeObj.end).getTime() : Infinity;
        return time >= startMs && time <= endMs;
      }
      default:
        return true;
    }
  }

  private applySort(items: any[], sortSpecs: SortSpecification[]): any[] {
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
