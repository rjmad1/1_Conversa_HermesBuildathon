import { SearchQueryAST } from "../ast/search-ast";

export interface SearchContext {
  tenantId: string;
  workspaceId: string;
  userId?: string;
  nowMs: number;
}

export interface IRankingProvider {
  readonly name: string;
  /**
   * Calculates a normalized relevance sub-score between [0.0, 1.0] for a single candidate item.
   */
  calculateScore(item: any, query: SearchQueryAST, context: SearchContext): number;
}

export interface IRankingStrategy {
  readonly name: string;
  /**
   * Aggregates sub-scores into a final normalized score between [0.0, 1.0].
   */
  aggregate(
    scores: Map<string, number>,
    weights: Map<string, number>
  ): number;
}
