import { randomUUID } from "node:crypto";
import type {
  MeetingRepo,
  AudioAssetRepo,
  TranscriptRepo,
  AnalysisRunRepo,
  MeetingAnalysisRepo,
  AuditRepo,
  WaitlistRepo,
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
  WaitlistEntry,
} from "../../shared/validation/schemas";
import { AppError, ErrorCode } from "../../shared/errors/AppError";
import type { AgencyRunRepo } from "../../modules/agency/domain/repositories";
import { InMemoryAgencyRunRepo } from "../../modules/agency/infrastructure/agency-repository";
import type {
  CompetitorRepo,
  IntelligenceSnapshotRepo,
  IntelligenceRunRepo,
  BattlecardRepo,
} from "../../modules/competitive-intelligence/domain/ports";
import {
  InMemoryCompetitorRepo,
  InMemoryIntelligenceSnapshotRepo,
  InMemoryIntelligenceRunRepo,
  InMemoryBattlecardRepo,
} from "../../modules/competitive-intelligence/infrastructure/in-memory-repositories";
import type { ChatRepo, ChatSession, ChatMessage } from "../../modules/analysis/domain/chat";

function scopeMatch(a: { tenantId?: string; workspaceId?: string }, tenantId: string, workspaceId: string): boolean {
  if (!a.tenantId || !a.workspaceId || !tenantId || !workspaceId) return false;
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
  async findByIdempotencyKey(tenantId: string, workspaceId: string, key: string): Promise<AnalysisRun | null> {
    const r = [...this.runs.values()].find((r) => r.idempotencyKey === key) ?? null;
    return r && scopeMatch(r, tenantId, workspaceId) ? r : null;
  }
}

export class InMemoryMeetingAnalysisRepo implements MeetingAnalysisRepo {
  private analyses = new Map<string, MeetingAnalysis>();
  private decisions = new Map<string, Decision>();
  private actions = new Map<string, ProposedAction>();
  private approvals = new Map<string, ApprovalDecision>();

  constructor(
    private readonly meetingRepoLookup?: () => MeetingRepo,
    private readonly analysisRunRepoLookup?: () => AnalysisRunRepo,
  ) {}

  private getMeetingRepo(): MeetingRepo {
    if (!this.meetingRepoLookup) {
      throw new Error("MeetingRepo lookup not configured in InMemoryMeetingAnalysisRepo");
    }
    return this.meetingRepoLookup();
  }

  private getAnalysisRunRepo(): AnalysisRunRepo {
    if (!this.analysisRunRepoLookup) {
      throw new Error("AnalysisRunRepo lookup not configured in InMemoryMeetingAnalysisRepo");
    }
    return this.analysisRunRepoLookup();
  }

  async save(tenantId: string, workspaceId: string, a: MeetingAnalysis): Promise<void> {
    const m = await this.getMeetingRepo().get(tenantId, workspaceId, a.meetingId);
    if (!m) throw new AppError(ErrorCode.NOT_FOUND, "Meeting not found", 404);
    this.analyses.set(a.id, a);
  }

  async getByMeeting(tenantId: string, workspaceId: string, meetingId: string): Promise<MeetingAnalysis | null> {
    const m = await this.getMeetingRepo().get(tenantId, workspaceId, meetingId);
    if (!m) return null;
    return [...this.analyses.values()].find((a) => a.meetingId === meetingId) ?? null;
  }

  async getByRun(tenantId: string, workspaceId: string, runId: string): Promise<MeetingAnalysis | null> {
    const r = await this.getAnalysisRunRepo().get(tenantId, workspaceId, runId);
    if (!r) return null;
    return [...this.analyses.values()].find((a) => a.meetingId === r.meetingId) ?? null;
  }

  async saveDecision(tenantId: string, workspaceId: string, d: Decision): Promise<void> {
    const m = await this.getMeetingRepo().get(tenantId, workspaceId, d.meetingId);
    if (!m) throw new AppError(ErrorCode.NOT_FOUND, "Meeting not found", 404);
    this.decisions.set(d.id, d);
  }

  async saveAction(tenantId: string, workspaceId: string, a: ProposedAction): Promise<void> {
    const m = await this.getMeetingRepo().get(tenantId, workspaceId, a.meetingId);
    if (!m) throw new AppError(ErrorCode.NOT_FOUND, "Meeting not found", 404);
    this.actions.set(a.id, a);
  }

  async getAction(tenantId: string, workspaceId: string, id: string): Promise<ProposedAction | null> {
    const a = this.actions.get(id);
    if (!a) return null;
    const m = await this.getMeetingRepo().get(tenantId, workspaceId, a.meetingId);
    if (!m) return null;
    return a;
  }

  async updateAction(tenantId: string, workspaceId: string, a: ProposedAction): Promise<void> {
    const existing = await this.getAction(tenantId, workspaceId, a.id);
    if (!existing) throw new AppError(ErrorCode.NOT_FOUND, "Action not found", 404);
    this.actions.set(a.id, a);
  }

  async saveApproval(tenantId: string, workspaceId: string, p: ApprovalDecision): Promise<void> {
    const action = await this.getAction(tenantId, workspaceId, p.actionId);
    if (!action) throw new AppError(ErrorCode.NOT_FOUND, "Action not found", 404);
    this.approvals.set(p.id, p);
  }

  async listActionsByMeeting(tenantId: string, workspaceId: string, meetingId: string): Promise<ProposedAction[]> {
    const m = await this.getMeetingRepo().get(tenantId, workspaceId, meetingId);
    if (!m) return [];
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

export class InMemoryWaitlistRepo implements WaitlistRepo {
  private entries = new Map<string, WaitlistEntry>();

  async save(entry: WaitlistEntry): Promise<void> {
    this.entries.set(entry.id, entry);
  }

  async getByEmail(tenantId: string, workspaceId: string, email: string): Promise<WaitlistEntry | null> {
    const normalized = email.toLowerCase().trim();
    return (
      [...this.entries.values()].find(
        (e) => e.email.toLowerCase().trim() === normalized && scopeMatch(e, tenantId, workspaceId)
      ) ?? null
    );
  }

  async list(tenantId: string, workspaceId: string): Promise<WaitlistEntry[]> {
    return [...this.entries.values()].filter((e) => scopeMatch(e, tenantId, workspaceId));
  }
}

export class InMemoryChatRepo implements ChatRepo {
  public sessions = new Map<string, ChatSession>();
  public messages: ChatMessage[] = [];

  async saveSession(session: ChatSession): Promise<void> {
    this.sessions.set(session.id, session);
  }

  async getSession(tenantId: string, workspaceId: string, id: string): Promise<ChatSession | null> {
    const s = this.sessions.get(id);
    return s && scopeMatch(s, tenantId, workspaceId) ? s : null;
  }

  async saveMessage(message: ChatMessage): Promise<void> {
    this.messages.push(message);
  }

  async listMessages(sessionId: string): Promise<ChatMessage[]> {
    return this.messages
      .filter((m) => m.sessionId === sessionId)
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
  agencyRun: AgencyRunRepo;
  waitlist: WaitlistRepo;
  competitor: CompetitorRepo;
  intelligenceSnapshot: IntelligenceSnapshotRepo;
  intelligenceRun: IntelligenceRunRepo;
  battlecard: BattlecardRepo;
  chat: ChatRepo;
}

export function buildInMemoryRepos(): Repos {
  const meeting = new InMemoryMeetingRepo();
  const audio = new InMemoryAudioAssetRepo();
  const transcript = new InMemoryTranscriptRepo();
  const analysisRun = new InMemoryAnalysisRunRepo();
  const meetingAnalysis = new InMemoryMeetingAnalysisRepo(
    () => meeting,
    () => analysisRun,
  );
  const audit = new InMemoryAuditRepo();
  const agencyRun = new InMemoryAgencyRunRepo();
  const waitlist = new InMemoryWaitlistRepo();
  const competitor = new InMemoryCompetitorRepo();
  const intelligenceSnapshot = new InMemoryIntelligenceSnapshotRepo();
  const intelligenceRun = new InMemoryIntelligenceRunRepo();
  const battlecard = new InMemoryBattlecardRepo();
  const chat = new InMemoryChatRepo();
  return {
    meeting,
    audio,
    transcript,
    analysisRun,
    meetingAnalysis,
    audit,
    agencyRun,
    waitlist,
    competitor,
    intelligenceSnapshot,
    intelligenceRun,
    battlecard,
    chat,
  };
}

export function resetWorkspaceData(repos: Repos, tenantId: string, workspaceId: string): void {
  const meetingRepo = repos.meeting as InMemoryMeetingRepo;
  const audioRepo = repos.audio as InMemoryAudioAssetRepo;
  const transcriptRepo = repos.transcript as InMemoryTranscriptRepo;
  const analysisRunRepo = repos.analysisRun as InMemoryAnalysisRunRepo;
  const meetingAnalysisRepo = repos.meetingAnalysis as InMemoryMeetingAnalysisRepo;
  const auditRepo = repos.audit as InMemoryAuditRepo;
  const agencyRunRepo = repos.agencyRun as any;

  // 1. Get meeting IDs to delete
  const meetingsToDelete = [...(meetingRepo as any).meetings.values()]
    .filter((m) => m.tenantId === tenantId && m.workspaceId === workspaceId);
  const meetingIds = new Set(meetingsToDelete.map((m) => m.id));

  // 2. Delete meetings
  for (const id of meetingIds) {
    (meetingRepo as any).meetings.delete(id);
  }

  // 3. Delete audio assets
  for (const [id, a] of [...(audioRepo as any).assets.entries()]) {
    if (a.tenantId === tenantId && a.workspaceId === workspaceId) {
      (audioRepo as any).assets.delete(id);
    }
  }

  // 4. Delete transcripts
  for (const [id, t] of [...(transcriptRepo as any).items.entries()]) {
    if (t.tenantId === tenantId && t.workspaceId === workspaceId) {
      (transcriptRepo as any).items.delete(id);
    }
  }

  // 5. Delete analysis runs
  for (const [id, r] of [...(analysisRunRepo as any).runs.entries()]) {
    if (r.tenantId === tenantId && r.workspaceId === workspaceId) {
      (analysisRunRepo as any).runs.delete(id);
    }
  }

  // 6. Delete analyses, decisions, actions, approvals
  for (const [id, a] of [...(meetingAnalysisRepo as any).analyses.entries()]) {
    if (meetingIds.has(a.meetingId)) {
      (meetingAnalysisRepo as any).analyses.delete(id);
    }
  }
  for (const [id, d] of [...(meetingAnalysisRepo as any).decisions.entries()]) {
    if (meetingIds.has(d.meetingId)) {
      (meetingAnalysisRepo as any).decisions.delete(id);
    }
  }
  const deletedActions = new Set<string>();
  for (const [id, a] of [...(meetingAnalysisRepo as any).actions.entries()]) {
    if (meetingIds.has(a.meetingId)) {
      (meetingAnalysisRepo as any).actions.delete(id);
      deletedActions.add(id);
    }
  }
  for (const [id, p] of [...(meetingAnalysisRepo as any).approvals.entries()]) {
    if (deletedActions.has(p.actionId)) {
      (meetingAnalysisRepo as any).approvals.delete(id);
    }
  }

  // 7. Delete audit events
  (auditRepo as any).events = (auditRepo as any).events.filter(
    (e: any) => !(e.tenantId === tenantId && e.workspaceId === workspaceId)
  );

  // 8. Delete agency runs and steps
  if (agencyRunRepo && agencyRunRepo.runs) {
    for (const [id, run] of [...agencyRunRepo.runs.entries()]) {
      if (run.tenantId === tenantId && run.workspaceId === workspaceId) {
        agencyRunRepo.runs.delete(id);
      }
    }
  }
  if (agencyRunRepo && agencyRunRepo.steps) {
    for (const [id, step] of [...agencyRunRepo.steps.entries()]) {
      if (step.tenantId === tenantId && step.workspaceId === workspaceId) {
        agencyRunRepo.steps.delete(id);
      }
    }
  }

  // 9. Delete waitlist entries
  const waitlistRepo = repos.waitlist as InMemoryWaitlistRepo;
  if (waitlistRepo && (waitlistRepo as any).entries) {
    for (const [id, entry] of [...(waitlistRepo as any).entries.entries()]) {
      if (entry.tenantId === tenantId && entry.workspaceId === workspaceId) {
        (waitlistRepo as any).entries.delete(id);
      }
    }
  }

  // 10. Delete competitive intelligence
  const competitorRepo = repos.competitor as InMemoryCompetitorRepo;
  if (competitorRepo && competitorRepo.competitors) {
    for (const [id, c] of [...competitorRepo.competitors.entries()]) {
      if (c.tenantId === tenantId && c.workspaceId === workspaceId) {
        competitorRepo.competitors.delete(id);
      }
    }
  }
  const snapshotRepo = repos.intelligenceSnapshot as InMemoryIntelligenceSnapshotRepo;
  if (snapshotRepo && snapshotRepo.snapshots) {
    for (const [id, s] of [...snapshotRepo.snapshots.entries()]) {
      if (s.tenantId === tenantId && s.workspaceId === workspaceId) {
        snapshotRepo.snapshots.delete(id);
      }
    }
  }
  const intelRunRepo = repos.intelligenceRun as InMemoryIntelligenceRunRepo;
  if (intelRunRepo && intelRunRepo.runs) {
    for (const [id, r] of [...intelRunRepo.runs.entries()]) {
      if (r.tenantId === tenantId && r.workspaceId === workspaceId) {
        intelRunRepo.runs.delete(id);
      }
    }
  }
  const battlecardRepo = repos.battlecard as InMemoryBattlecardRepo;
  if (battlecardRepo && battlecardRepo.battlecards) {
    for (const [id, b] of [...battlecardRepo.battlecards.entries()]) {
      if (b.tenantId === tenantId && b.workspaceId === workspaceId) {
        battlecardRepo.battlecards.delete(id);
      }
    }
  }

  // 11. Delete chat sessions and messages
  const chatRepo = repos.chat as InMemoryChatRepo;
  if (chatRepo && chatRepo.sessions) {
    for (const [id, s] of [...chatRepo.sessions.entries()]) {
      if (s.tenantId === tenantId && s.workspaceId === workspaceId) {
        chatRepo.sessions.delete(id);
      }
    }
  }
  if (chatRepo && chatRepo.messages) {
    // Collect session IDs that belong to the deleted tenant/workspace or deleted meetings
    const activeSessionIds = new Set(
      [...chatRepo.sessions.values()].map(s => s.id)
    );
    chatRepo.messages = chatRepo.messages.filter(m => activeSessionIds.has(m.sessionId));
  }
}

export { randomUUID };
