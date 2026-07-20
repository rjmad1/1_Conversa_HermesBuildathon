import { CoreQueryAST } from "../../../query/domain/ast";

export interface KeywordClause {
  terms: string[];
  exactPhrases?: string[];
  excludeTerms?: string[];
  fuzziness?: number;
}

export interface FieldBoost {
  field: string;
  boostFactor: number;
}

export interface ProjectionHints {
  includeHighlights?: boolean;
  includeBreadcrumbs?: boolean;
  includeGraphNeighborhood?: boolean;
  maxContextDepth?: number;
}

export interface SearchQueryAST {
  version: number;
  coreQuery?: CoreQueryAST;
  keywords?: KeywordClause;
  boosts?: FieldBoost[];
  rankingProfile?: string; // 'WorkspaceSearch' | 'CommandPalette' | 'AIContext' | 'Navigation'
  contextProfile?: string; // 'Minimal' | 'Navigation' | 'Workspace' | 'AI'
  projectionHints?: ProjectionHints;
}
