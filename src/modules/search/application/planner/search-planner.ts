import { SearchQueryAST } from "../../domain/ast/search-ast";

export interface ExecutionPlan {
  planId: string;
  planHash: string;
  normalizedAST: SearchQueryAST;
  targetObjectTypes: string[];
  rankingProfile: string;
  contextProfile: string;
  cacheStrategy: {
    ttlSeconds: number;
    allowCache: boolean;
  };
  estimatedCost: {
    isBroadQuery: boolean;
    estimatedItemsCount: number;
  };
}

export class SearchPlanner {
  public createPlan(query: SearchQueryAST): ExecutionPlan {
    const normalizedAST = this.normalize(query);
    const planHash = this.computePlanHash(normalizedAST);

    const targetObjectTypes = normalizedAST.coreQuery?.objectTypes || [];
    const isBroadQuery =
      (!normalizedAST.keywords || normalizedAST.keywords.terms.length === 0) &&
      !normalizedAST.coreQuery?.predicate;

    return {
      planId: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      planHash,
      normalizedAST,
      targetObjectTypes,
      rankingProfile: normalizedAST.rankingProfile || "WorkspaceSearch",
      contextProfile: normalizedAST.contextProfile || "Minimal",
      cacheStrategy: {
        ttlSeconds: 60,
        allowCache: true,
      },
      estimatedCost: {
        isBroadQuery,
        estimatedItemsCount: isBroadQuery ? 1000 : 50,
      },
    };
  }

  private normalize(query: SearchQueryAST): SearchQueryAST {
    const copy: SearchQueryAST = JSON.parse(JSON.stringify(query || { version: 1 }));

    if (copy.keywords && copy.keywords.terms) {
      copy.keywords.terms = copy.keywords.terms
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);
    }

    if (!copy.rankingProfile) {
      copy.rankingProfile = "WorkspaceSearch";
    }

    if (!copy.contextProfile) {
      copy.contextProfile = "Minimal";
    }

    return copy;
  }

  private computePlanHash(ast: SearchQueryAST): string {
    const str = JSON.stringify(ast);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `plan_hash_${Math.abs(hash).toString(16)}`;
  }
}
