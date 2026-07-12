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
  findByIdempotencyKey(key: string): Promise<AnalysisRun | null>;
}

export interface MeetingAnalysisRepo {
  save(a: MeetingAnalysis): Promise<void>;
  getByMeeting(tenantId: string, workspaceId: string, meetingId: string): Promise<MeetingAnalysis | null>;
  getByRun(tenantId: string, workspaceId: string, runId: string): Promise<MeetingAnalysis | null>;
  saveDecision(d: Decision): Promise<void>;
  saveAction(a: ProposedAction): Promise<void>;
  getAction(tenantId: string, workspaceId: string, id: string): Promise<ProposedAction | null>;
  updateAction(a: ProposedAction): Promise<void>;
  saveApproval(p: ApprovalDecision): Promise<void>;
  listActionsByMeeting(tenantId: string, workspaceId: string, meetingId: string): Promise<ProposedAction[]>;
}

export interface AuditRepo {
  append(e: AuditEvent): Promise<void>;
  listByMeeting(tenantId: string, workspaceId: string, meetingId: string): Promise<AuditEvent[]>;
}

export interface UnitOfWork {
  commit(): Promise<void>;
}
