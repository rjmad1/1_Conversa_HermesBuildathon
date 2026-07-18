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
} from "../../../shared/validation/schemas";

export interface MeetingRepo {
  save(m: Meeting): Promise<void>;
  get(tenantId: string, workspaceId: string, id: string): Promise<Meeting | null>;
  listByScope(tenantId: string, workspaceId: string): Promise<Meeting[]>;
}

export interface AudioAssetRepo {
  save(a: AudioAsset): Promise<void>;
  get(tenantId: string, workspaceId: string, id: string): Promise<AudioAsset | null>;
  findByChecksum(tenantId: string, workspaceId: string, meetingId: string, checksum: string): Promise<AudioAsset | null>;
  findByMeeting(tenantId: string, workspaceId: string, meetingId: string): Promise<AudioAsset[]>;
}

export interface TranscriptRepo {
  save(t: Transcript): Promise<void>;
  get(tenantId: string, workspaceId: string, id: string): Promise<Transcript | null>;
  findByMeeting(tenantId: string, workspaceId: string, meetingId: string): Promise<Transcript[]>;
}

export interface AnalysisRunRepo {
  save(r: AnalysisRun): Promise<void>;
  get(tenantId: string, workspaceId: string, id: string): Promise<AnalysisRun | null>;
  findByMeeting(tenantId: string, workspaceId: string, meetingId: string): Promise<AnalysisRun[]>;
  findByIdempotencyKey(tenantId: string, workspaceId: string, key: string): Promise<AnalysisRun | null>;
}

export interface MeetingAnalysisRepo {
  save(tenantId: string, workspaceId: string, a: MeetingAnalysis): Promise<void>;
  getByMeeting(tenantId: string, workspaceId: string, meetingId: string): Promise<MeetingAnalysis | null>;
  getByRun(tenantId: string, workspaceId: string, runId: string): Promise<MeetingAnalysis | null>;
  saveDecision(tenantId: string, workspaceId: string, d: Decision): Promise<void>;
  saveAction(tenantId: string, workspaceId: string, a: ProposedAction): Promise<void>;
  getAction(tenantId: string, workspaceId: string, id: string): Promise<ProposedAction | null>;
  updateAction(tenantId: string, workspaceId: string, a: ProposedAction): Promise<void>;
  saveApproval(tenantId: string, workspaceId: string, p: ApprovalDecision): Promise<void>;
  listActionsByMeeting(tenantId: string, workspaceId: string, meetingId: string): Promise<ProposedAction[]>;
}

export interface AuditRepo {
  append(e: AuditEvent): Promise<void>;
  listByMeeting(tenantId: string, workspaceId: string, meetingId: string): Promise<AuditEvent[]>;
}

export interface WaitlistRepo {
  save(entry: WaitlistEntry): Promise<void>;
  getByEmail(tenantId: string, workspaceId: string, email: string): Promise<WaitlistEntry | null>;
  list(tenantId: string, workspaceId: string): Promise<WaitlistEntry[]>;
}

export interface UnitOfWork {
  commit(): Promise<void>;
}

