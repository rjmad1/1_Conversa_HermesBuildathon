export interface WordTimestamp {
  word: string;
  startMs: number;
  endMs: number;
  confidence: number;
}

export interface TranscriptSegment {
  id: string;
  speakerId?: string;
  speakerName?: string;
  startMs: number;
  endMs: number;
  text: string;
  words?: WordTimestamp[];
  confidence: number;
}

export interface TranscriptPayload {
  meetingId: string;
  fullText: string;
  durationMs: number;
  segments: TranscriptSegment[];
  wordCount: number;
  overallConfidence: number;
}

export interface SpeakerSegment {
  speakerId: string;
  speakerName?: string;
  startMs: number;
  endMs: number;
  confidence: number;
  tone?: string;
}

export interface SpeakerSummary {
  id: string;
  name?: string;
  totalSpeakingTimeMs: number;
  turnCount: number;
}

export interface SpeakerTimelinePayload {
  meetingId: string;
  speakers: SpeakerSummary[];
  timeline: SpeakerSegment[];
  overallConfidence: number;
}

export interface SubTopic {
  title: string;
  summary: string;
  startMs: number;
  endMs: number;
}

export interface SemanticTopic {
  id: string;
  title: string;
  description: string;
  startMs: number;
  endMs: number;
  subtopics: SubTopic[];
  keywords: string[];
  confidence: number;
}

export interface TopicSegmentationPayload {
  meetingId: string;
  topics: SemanticTopic[];
  overallConfidence: number;
}

export interface DecisionItem {
  id: string;
  title: string;
  description: string;
  status: "Approved" | "Rejected" | "Proposed";
  owner: string;
  rationale: string;
  quote: string;
  startMs: number;
  endMs: number;
  confidence: number;
}

export interface DecisionExtractionPayload {
  meetingId: string;
  decisions: DecisionItem[];
  overallConfidence: number;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  owner: string;
  dueDate?: string;
  priority: "High" | "Medium" | "Low";
  dependencies: string[];
  quote: string;
  startMs: number;
  endMs: number;
  confidence: number;
}

export interface ActionExtractionPayload {
  meetingId: string;
  actions: ActionItem[];
  overallConfidence: number;
}

export interface RiskItem {
  id: string;
  category: "Risk" | "Blocker" | "Unknown" | "Assumption";
  description: string;
  impact: "High" | "Medium" | "Low";
  mitigationSuggestion?: string;
  quote: string;
  startMs: number;
  endMs: number;
  confidence: number;
}

export interface RiskPayload {
  meetingId: string;
  risks: RiskItem[];
  overallConfidence: number;
}

export interface WorkspaceObjectMapping {
  id: string;
  entityType: "Project" | "Task" | "Meeting" | "Document" | "User";
  entityId: string;
  entityName: string;
  relationshipType: "Mentions" | "Modifies" | "Blocks" | "DependsOn" | "FollowsUp";
  confidence: number;
  provenanceQuote?: string;
}

export interface KnowledgeMappingPayload {
  meetingId: string;
  mappings: WorkspaceObjectMapping[];
  overallConfidence: number;
}

export interface ConsensusSummary {
  meetingId: string;
  executiveSummary: string;
  keyDecisions: string[];
  criticalActions: string[];
  topRisks: string[];
  consensusConfidence: number;
}
