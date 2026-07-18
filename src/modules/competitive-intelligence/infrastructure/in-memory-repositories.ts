import type { Competitor } from "../domain/competitor";
import type { IntelligenceSnapshot } from "../domain/intelligence-snapshot";
import type { IntelligenceRun } from "../domain/intelligence-run";
import type { Battlecard } from "../domain/battlecard";
import type {
  CompetitorRepo,
  IntelligenceSnapshotRepo,
  IntelligenceRunRepo,
  BattlecardRepo,
} from "../domain/ports";

function scopeMatch(a: { tenantId?: string; workspaceId?: string }, tenantId: string, workspaceId: string): boolean {
  if (!a.tenantId || !a.workspaceId || !tenantId || !workspaceId) return false;
  return a.tenantId === tenantId && a.workspaceId === workspaceId;
}

export class InMemoryCompetitorRepo implements CompetitorRepo {
  public competitors = new Map<string, Competitor>();

  async save(c: Competitor): Promise<void> {
    this.competitors.set(c.id, c);
  }

  async get(tenantId: string, workspaceId: string, id: string): Promise<Competitor | null> {
    const c = this.competitors.get(id);
    return c && scopeMatch(c, tenantId, workspaceId) ? c : null;
  }

  async list(tenantId: string, workspaceId: string): Promise<Competitor[]> {
    return [...this.competitors.values()].filter((c) => scopeMatch(c, tenantId, workspaceId));
  }
}

export class InMemoryIntelligenceSnapshotRepo implements IntelligenceSnapshotRepo {
  public snapshots = new Map<string, IntelligenceSnapshot>();

  async save(s: IntelligenceSnapshot): Promise<void> {
    this.snapshots.set(s.id, s);
  }

  async get(tenantId: string, workspaceId: string, id: string): Promise<IntelligenceSnapshot | null> {
    const s = this.snapshots.get(id);
    return s && scopeMatch(s, tenantId, workspaceId) ? s : null;
  }

  async getLatestByCategory(tenantId: string, workspaceId: string, competitorId: string, category: string): Promise<IntelligenceSnapshot | null> {
    const matches = [...this.snapshots.values()]
      .filter((s) => s.competitorId === competitorId && s.researchCategory === category && scopeMatch(s, tenantId, workspaceId))
      .sort((a, b) => b.retrievedAt.localeCompare(a.retrievedAt));
    return matches[0] || null;
  }

  async listForRun(tenantId: string, workspaceId: string, runId: string): Promise<IntelligenceSnapshot[]> {
    return [...this.snapshots.values()].filter((s) => s.runId === runId && scopeMatch(s, tenantId, workspaceId));
  }
}

export class InMemoryIntelligenceRunRepo implements IntelligenceRunRepo {
  public runs = new Map<string, IntelligenceRun>();

  async save(r: IntelligenceRun): Promise<void> {
    this.runs.set(r.runId, r);
  }

  async get(tenantId: string, workspaceId: string, runId: string): Promise<IntelligenceRun | null> {
    const r = this.runs.get(runId);
    return r && scopeMatch(r, tenantId, workspaceId) ? r : null;
  }

  async list(tenantId: string, workspaceId: string, competitorId?: string): Promise<IntelligenceRun[]> {
    return [...this.runs.values()].filter((r) => {
      const matchScope = scopeMatch(r, tenantId, workspaceId);
      const matchComp = competitorId ? r.competitorId === competitorId : true;
      return matchScope && matchComp;
    });
  }
}

export class InMemoryBattlecardRepo implements BattlecardRepo {
  public battlecards = new Map<string, Battlecard>();

  async save(b: Battlecard): Promise<void> {
    this.battlecards.set(b.competitorId, b);
  }

  async get(tenantId: string, workspaceId: string, competitorId: string): Promise<Battlecard | null> {
    const b = this.battlecards.get(competitorId);
    return b && scopeMatch(b, tenantId, workspaceId) ? b : null;
  }
}
