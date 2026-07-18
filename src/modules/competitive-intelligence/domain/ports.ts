import type { Competitor } from "./competitor";
import type { IntelligenceSnapshot } from "./intelligence-snapshot";
import type { IntelligenceRun } from "./intelligence-run";
import type { Battlecard } from "./battlecard";
import type { ResearchFinding } from "./research-finding";

export interface CompetitorRepo {
  save(c: Competitor): Promise<void>;
  get(tenantId: string, workspaceId: string, id: string): Promise<Competitor | null>;
  list(tenantId: string, workspaceId: string): Promise<Competitor[]>;
}

export interface IntelligenceSnapshotRepo {
  save(s: IntelligenceSnapshot): Promise<void>;
  get(tenantId: string, workspaceId: string, id: string): Promise<IntelligenceSnapshot | null>;
  getLatestByCategory(tenantId: string, workspaceId: string, competitorId: string, category: string): Promise<IntelligenceSnapshot | null>;
  listForRun(tenantId: string, workspaceId: string, runId: string): Promise<IntelligenceSnapshot[]>;
}

export interface IntelligenceRunRepo {
  save(r: IntelligenceRun): Promise<void>;
  get(tenantId: string, workspaceId: string, runId: string): Promise<IntelligenceRun | null>;
  list(tenantId: string, workspaceId: string, competitorId?: string): Promise<IntelligenceRun[]>;
}

export interface BattlecardRepo {
  save(b: Battlecard): Promise<void>;
  get(tenantId: string, workspaceId: string, competitorId: string): Promise<Battlecard | null>;
}

export interface ResearchProvider {
  fetchPricing(url: string, competitorName: string, searchTerms?: string[]): Promise<Partial<ResearchFinding>>;
  fetchChangelog(url: string, competitorName: string, searchTerms?: string[]): Promise<Partial<ResearchFinding>>;
  fetchNews(url: string, competitorName: string, searchTerms?: string[]): Promise<Partial<ResearchFinding>>;
}

export interface SlackAdapter {
  sendDigest(
    competitorName: string,
    timestamp: string,
    materialChanges: string,
    businessImplication: string,
    recommendedResponse: string,
    sourceLinks: string[],
    runId: string
  ): Promise<{ delivered: boolean; error?: string }>;
}
