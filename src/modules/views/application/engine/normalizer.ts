import { ViewQueryAST } from "../../domain/ast/query-ast";
import { FilterExpression } from "../../domain/ast/filter-ast";

export class ViewQueryNormalizer {
  public normalize(ast?: ViewQueryAST): ViewQueryAST {
    if (!ast) {
      return {
        version: 1,
        filter: undefined,
        sort: [],
        group: [],
        pagination: { offset: 0, limit: 100 },
      };
    }

    return {
      version: ast.version || 1,
      filter: ast.filter ? this.normalizeFilter(ast.filter) : undefined,
      sort: ast.sort ? ast.sort.map((s) => ({ ...s })) : [],
      group: ast.group ? ast.group.map((g) => ({ ...g })) : [],
      projection: ast.projection ? { ...ast.projection } : undefined,
      pagination: {
        offset: ast.pagination?.offset ?? 0,
        limit: Math.min(ast.pagination?.limit ?? 100, 1000),
        cursor: ast.pagination?.cursor,
      },
    };
  }

  private normalizeFilter(filter: FilterExpression): FilterExpression {
    if (filter.type === "logical") {
      const normalizedChildren = filter.expressions
        .map((child) => this.normalizeFilter(child))
        .filter((child): child is FilterExpression => Boolean(child));

      const firstChild = normalizedChildren[0];
      if (firstChild && normalizedChildren.length === 1 && filter.operator !== "NOT") {
        return firstChild;
      }

      return {
        ...filter,
        expressions: normalizedChildren,
      };
    }

    return { ...filter };
  }
}
