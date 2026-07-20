import { CanonicalContext } from "../../../context/domain/entities/canonical-context";

export interface ScoreBreakdown {
  keyword?: number;
  metadata?: number;
  graphProximity?: number;
  recency?: number;
  typeBoost?: number;
  workspaceSignal?: number;
  [providerName: string]: number | undefined;
}

export interface MatchedField {
  field: string;
  matchedTerm: string;
  snippet?: string;
}

export interface Highlight {
  field: string;
  fragments: string[];
}

export interface CanonicalSearchResult {
  id: string;
  objectTypeId: string;
  title: string;
  summary?: string;
  rank: number;
  score: number; // Normalized total score [0.0, 1.0]
  breakdown: ScoreBreakdown;
  matchedFields: MatchedField[];
  highlights: Highlight[];
  context?: CanonicalContext;
  permissions?: {
    canRead: boolean;
    canWrite: boolean;
    canShare: boolean;
  };
  preview?: {
    snippet?: string;
    properties?: Record<string, any>;
    metadata?: Record<string, any>;
  };
  createdAt: number;
  updatedAt: number;
}
