import { AgentEvidencePackage } from "./agent-contract";

export type PipelineStage =
  | "Queued"
  | "Initializing"
  | "Transcribing"
  | "Diarizing"
  | "SegmentingTopics"
  | "ExtractingInsights"
  | "MappingKnowledge"
  | "DebateReady"
  | "ConsensusGenerating"
  | "Completed"
  | "Paused"
  | "Cancelled"
  | "Failed"
  | "Recovering";

export interface PipelineManifest {
  pipelineVersion: string;
  graphVersion: string;
  agentVersions: Record<string, string>;
  promptVersions: Record<string, string>;
  providerVersions: Record<string, string>;
  modelVersions: Record<string, string>;
  policyVersion: string;
  schemaVersion: string;
  workspaceId?: string;
  tenantId?: string;
}

export interface PipelineCheckpoint {
  checkpointId: string;
  stage: PipelineStage;
  completedAgentIds: string[];
  evidencePackages: Record<string, AgentEvidencePackage<any>>;
  timestamp: number;
  hash: string;
}

export interface PipelineRunSnapshot {
  runId: string;
  meetingId: string;
  manifest: PipelineManifest;
  state: PipelineStage;
  activeStage: PipelineStage;
  completedAgents: string[];
  failedAgents: Record<string, string>; // agentId -> error message
  checkpoints: PipelineCheckpoint[];
  latestCheckpoint?: PipelineCheckpoint;
  retryCount: number;
  metadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface IPipelineStateRepository {
  saveSnapshot(snapshot: PipelineRunSnapshot): Promise<void>;
  loadSnapshot(runId: string): Promise<PipelineRunSnapshot | null>;
  loadByMeetingId(meetingId: string): Promise<PipelineRunSnapshot | null>;
  persistCheckpoint(runId: string, checkpoint: PipelineCheckpoint): Promise<void>;
  restoreLatestCheckpoint(runId: string): Promise<PipelineCheckpoint | null>;
}

export interface PipelineStartOptions {
  audioBuffer?: Buffer | string;
  audioUrl?: string;
  meetingId: string;
  workspaceId?: string;
  tenantId?: string;
  metadata?: Record<string, unknown>;
}

export interface IMeetingPipelineOrchestrator {
  startPipeline(options: PipelineStartOptions): Promise<PipelineRunSnapshot>;
  pausePipeline(runId: string): Promise<PipelineRunSnapshot>;
  resumePipeline(runId: string): Promise<PipelineRunSnapshot>;
  cancelPipeline(runId: string): Promise<PipelineRunSnapshot>;
  retryPipeline(runId: string): Promise<PipelineRunSnapshot>;
  getRunStatus(runId: string): Promise<PipelineRunSnapshot | null>;
}

export interface IMeetingPipelineFacade {
  processMeeting(options: PipelineStartOptions): Promise<PipelineRunSnapshot>;
  pauseProcessing(runId: string): Promise<PipelineRunSnapshot>;
  resumeProcessing(runId: string): Promise<PipelineRunSnapshot>;
  cancelProcessing(runId: string): Promise<PipelineRunSnapshot>;
  retryProcessing(runId: string): Promise<PipelineRunSnapshot>;
  getProcessingStatus(runId: string): Promise<PipelineRunSnapshot | null>;
}
