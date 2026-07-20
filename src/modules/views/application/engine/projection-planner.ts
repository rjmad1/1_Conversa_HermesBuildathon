import { ViewDefinition } from "../../domain/entities/view-definition";
import { ViewQueryAST } from "../../domain/ast/query-ast";
import { ViewQueryNormalizer } from "./normalizer";

export interface ExecutionPlan {
  viewId: string;
  layoutType: string;
  executionMode: "interactive" | "analytical" | "export";
  normalizedAST: ViewQueryAST;
  targetObjectTypes: string[];
  requiresGraphTraversal: boolean;
  maxTraversalDepth: number;
}

export class ProjectionPlanner {
  private normalizer = new ViewQueryNormalizer();

  public createPlan(
    definition: ViewDefinition,
    requestOptions?: { mode?: "interactive" | "analytical" | "export"; pageSize?: number }
  ): ExecutionPlan {
    const normalizedAST = this.normalizer.normalize(definition.queryAST);

    if (requestOptions?.pageSize) {
      normalizedAST.pagination = {
        ...normalizedAST.pagination,
        limit: requestOptions.pageSize,
      };
    }

    const isNetworkOrHierarchy =
      definition.layoutType === "hierarchy" ||
      definition.layoutType === "tree" ||
      definition.layoutType === "network";

    const executionMode = requestOptions?.mode || (isNetworkOrHierarchy ? "analytical" : "interactive");

    return {
      viewId: definition.id,
      layoutType: definition.layoutType,
      executionMode,
      normalizedAST,
      targetObjectTypes: definition.objectTypes || [],
      requiresGraphTraversal: isNetworkOrHierarchy || !!normalizedAST.projection?.includeRelationships,
      maxTraversalDepth: normalizedAST.projection?.maxTraversalDepth ?? (isNetworkOrHierarchy ? 3 : 1),
    };
  }
}
