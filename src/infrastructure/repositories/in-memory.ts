import { randomUUID } from "node:crypto";
import type {
  MeetingRepo,
  AudioAssetRepo,
  TranscriptRepo,
  AnalysisRunRepo,
  MeetingAnalysisRepo,
  AuditRepo,
} from "../../modules/meetings/domain/repositories";
import type {
  Meeting,
  AudioAsset,
  Transcript,
  AnalysisRun,
  MeetingAnalysis,
  Decision,
  ProposedAction,
  ApprovalDecision,
  AuditEvent,
} from "../../shared/validation/schemas";

function scopeMatch(a: { tenantId: string; workspaceId: string }, tenantId: string, workspaceId: string): boolean {
  return a.tenantId === tenantId && a.workspaceId === workspaceId;
}

export class InMemoryMeetingRepo implements MeetingRepo {
  private meetings = new Map<string, Meeting>();
  async save(m: Meeting): Promise<void> {
    this.meetings.set(m.id, m);
  }
  async get(tenantId: string, workspaceId: string, id: string): Promise<Meeting | null> {
    const m = this.meetings.get(id);
    return m && scopeMatch(m, tenantId, workspaceId) ? m : null;
  }
  async listByScope(tenantId: string, workspaceId: string): Promise<Meeting[]> {
    return [...this.meetings.values()].filter((m) => scopeMatch(m, tenantId, workspaceId));
  }
}

export class InMemoryAudioAssetRepo implements AudioAssetRepo {
  private assets = new Map<string, AudioAsset>();
  async save(a: AudioAsset): Promise<void> {
    this.assets.set(a.id, a);
  }
  async get(tenantId: string, workspaceId: string, id: string): Promise<AudioAsset | null> {
    const a = this.assets.get(id);
    return a && scopeMatch(a, tenantId, workspaceId) ? a : null;
  }
  async findByChecksum(tenantId: string, workspaceId: string, meetingId: string, checksum: string): Promise<AudioAsset | null> {
    return (
      [...this.assets.values()].find(
        (a) => a.checksum === checksum && a.meetingId === meetingId && scopeMatch(a, tenantId, workspaceId),
      ) ?? null
    );
  }
  async findByMeeting(tenantId: string, workspaceId: string, meetingId: string): Promise<AudioAsset[]> {
    return [...this.assets.values()].filter((a) => a.meetingId === meetingId && scopeMatch(a, tenantId, workspaceId));
  }
}

export class InMemoryTranscriptRepo implements TranscriptRepo {
  private items = new Map<string, Transcript>();
  async save(t: Transcript): Promise<void> {
    this.items.set(t.id, t);
  }
  async get(tenantId: string, workspaceId: string, id: string): Promise<Transcript | null> {
    const t = this.items.get(id);
    return t && scopeMatch(t, tenantId, workspaceId) ? t : null;
  }
  async findByMeeting(tenantId: string, workspaceId: string, meetingId: string): Promise<Transcript[]> {
    return [...this.items.values()].filter((t) => t.meetingId === meetingId && scopeMatch(t, tenantId, workspaceId));
  }
}

export class InMemoryAnalysisRunRepo implements AnalysisRunRepo {
  private runs = new Map<string, AnalysisRun>();
  async save(r: AnalysisRun): Promise<void> {
    this.runs.set(r.id, r);
  }
  async get(tenantId: string, workspaceId: string, id: string): Promise<AnalysisRun | null> {
    const r = this.runs.get(id);
    return r && scopeMatch(r, tenantId, workspaceId) ? r : null;
  }
  async findByMeeting(tenantId: string, workspaceId: string, meetingId: string): Promise<AnalysisRun[]> {
    return [...this.runs.values()].filter((r) => r.meetingId === meetingId && scopeMatch(r, tenantId, workspaceId));
  }
  async findByIdempotencyKey(key: string): Promise<AnalysisRun | null> {
    return [...this.runs.values()].find((r) => r.idempotencyKey === key) ?? null;
  }
}

export class InMemoryMeetingAnalysisRepo implements MeetingAnalysisRepo {
  private analyses = new Map<string, MeetingAnalysis>();
  private decisions = new Map<string, Decision>();
  private actions = new Map<string, ProposedAction>();
  private approvals = new Map<string, ApprovalDecision>();
  async save(a: MeetingAnalysis): Promise<void> {
    this.analyses.set(a.id, a);
  }
  async getByMeeting(tenantId: string, workspaceId: string, meetingId: string): Promise<MeetingAnalysis | null> {
    return [...this.analyses.values()].find((a) => a.meetingId === meetingId) ?? null;
  }
  async getByRun(): Promise<MeetingAnalysis | null> {
    return null;
  }
  async saveDecision(d: Decision): Promise<void> {
    this.decisions.set(d.id, d);
  }
  async saveAction(a: ProposedAction): Promise<void> {
    this.actions.set(a.id, a);
  }
  async getAction(tenantId: string, workspaceId: string, id: string): Promise<ProposedAction | null> {
    const a = this.actions.get(id);
    return a ?? null;
  }
  async updateAction(a: ProposedAction): Promise<void> {
    this.actions.set(a.id, a);
  }
  async saveApproval(p: ApprovalDecision): Promise<void> {
    this.approvals.set(p.id, p);
  }
  async listActionsByMeeting(tenantId: string, workspaceId: string, meetingId: string): Promise<ProposedAction[]> {
    return [...this.actions.values()].filter((a) => a.meetingId === meetingId);
  }
}

export class InMemoryAuditRepo implements AuditRepo {
  private events: AuditEvent[] = [];
  async append(e: AuditEvent): Promise<void> {
    this.events.push(e);
  }
  async listByMeeting(tenantId: string, workspaceId: string, meetingId: string): Promise<AuditEvent[]> {
    return this.events
      .filter((e) => e.meetingId === meetingId && scopeMatch(e, tenantId, workspaceId))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
}

export interface Repos {
  meeting: MeetingRepo;
  audio: AudioAssetRepo;
  transcript: TranscriptRepo;
  analysisRun: AnalysisRunRepo;
  meetingAnalysis: MeetingAnalysisRepo;
  audit: AuditRepo;
}

export function buildInMemoryRepos(): Repos {
  return {
    meeting: new InMemoryMeetingRepo(),
    audio: new InMemoryAudioAssetRepo(),
    transcript: new InMemoryTranscriptRepo(),
    analysisRun: new InMemoryAnalysisRunRepo(),
    meetingAnalysis: new InMemoryMeetingAnalysisRepo(),
    audit: new InMemoryAuditRepo(),
  };
}

export { randomUUID };
