import { PlatformEvent } from "../../../platform/events";
import { AgentEvidencePackage } from "../contracts/agent-contract";
import { PipelineStage, PipelineCheckpoint } from "../contracts/pipeline-contract";
import {
  TranscriptPayload,
  SpeakerTimelinePayload,
  TopicSegmentationPayload,
  DecisionExtractionPayload,
  ActionExtractionPayload,
  RiskPayload,
  KnowledgeMappingPayload,
  ConsensusSummary
} from "../domain/models";

export const MEETING_INTELLIGENCE_EVENTS = {
  MEETING_UPLOADED: "meeting_intelligence.uploaded",
  TRANSCRIPTION_COMPLETED: "meeting_intelligence.transcription_completed",
  DIARIZATION_COMPLETED: "meeting_intelligence.diarization_completed",
  TOPICS_EXTRACTED: "meeting_intelligence.topics_extracted",
  DECISION_FOUND: "meeting_intelligence.decision_found",
  ACTION_ITEM_FOUND: "meeting_intelligence.action_item_found",
  RISK_IDENTIFIED: "meeting_intelligence.risk_identified",
  KNOWLEDGE_MAPPED: "meeting_intelligence.knowledge_mapped",
  CHECKPOINT_CREATED: "meeting_intelligence.checkpoint_created",
  PIPELINE_PAUSED: "meeting_intelligence.pipeline_paused",
  PIPELINE_RESUMED: "meeting_intelligence.pipeline_resumed",
  PIPELINE_FAILED: "meeting_intelligence.pipeline_failed",
  PIPELINE_COMPLETED: "meeting_intelligence.pipeline_completed",
} as const;

export interface MeetingUploadedPayload {
  runId: string;
  meetingId: string;
  audioUrl?: string;
  durationMs?: number;
}

export interface TranscriptionCompletedPayload {
  runId: string;
  meetingId: string;
  evidencePackage: AgentEvidencePackage<TranscriptPayload>;
}

export interface DiarizationCompletedPayload {
  runId: string;
  meetingId: string;
  evidencePackage: AgentEvidencePackage<SpeakerTimelinePayload>;
}

export interface TopicsExtractedPayload {
  runId: string;
  meetingId: string;
  evidencePackage: AgentEvidencePackage<TopicSegmentationPayload>;
}

export interface DecisionFoundPayload {
  runId: string;
  meetingId: string;
  evidencePackage: AgentEvidencePackage<DecisionExtractionPayload>;
}

export interface ActionItemFoundPayload {
  runId: string;
  meetingId: string;
  evidencePackage: AgentEvidencePackage<ActionExtractionPayload>;
}

export interface RiskIdentifiedPayload {
  runId: string;
  meetingId: string;
  evidencePackage: AgentEvidencePackage<RiskPayload>;
}

export interface KnowledgeMappedPayload {
  runId: string;
  meetingId: string;
  evidencePackage: AgentEvidencePackage<KnowledgeMappingPayload>;
}

export interface CheckpointCreatedPayload {
  runId: string;
  meetingId: string;
  checkpoint: PipelineCheckpoint;
}

export interface PipelineLifecycleEventPayload {
  runId: string;
  meetingId: string;
  stage: PipelineStage;
  reason?: string;
  error?: string;
}

export interface PipelineCompletedPayload {
  runId: string;
  meetingId: string;
  summary: ConsensusSummary;
  allEvidencePackages: Record<string, AgentEvidencePackage<any>>;
}
