export type PrivacyClassification =
  | "Public"
  | "Internal"
  | "Confidential"
  | "Restricted"
  | "Regulated";

export type AgentExecutionStatus = "Success" | "Partial" | "Failure";

export interface TranscriptLocation {
  startMs: number;
  endMs: number;
  segmentId?: string;
  wordIndexStart?: number;
  wordIndexEnd?: number;
}

export interface EvidenceSource {
  id: string;
  meetingId: string;
  transcriptLocation?: TranscriptLocation;
  speakerId?: string;
  speakerName?: string;
  verbatimQuote?: string;
  contextSnippet?: string;
}

export interface ReasoningMetadata {
  extractionStrategy: string;
  provider: string;
  model: string;
  promptVersion: string;
  executionDurationMs: number;
  tokensUsed?: number;
}

export interface GovernanceMetadata {
  validationStatus: "Validated" | "PendingReview" | "Rejected";
  privacyClassification: PrivacyClassification;
  policyCompliance: boolean;
  reviewRequired: boolean;
  policyNotes?: string[];
}

export interface QualityMetrics {
  ambiguityScore: number; // 0 (clear) to 1 (highly ambiguous)
  completenessScore: number; // 0 to 1
  consistencyScore: number; // 0 to 1
}

export interface ConfidenceDistribution {
  sourceConfidence: number;
  modelConfidence: number;
  evidenceStrength: number;
  crossAgentAgreement: number;
  validationConfidence: number;
  overall: number;
}

export interface AgentEvidencePackage<TOutput> {
  packageId: string;
  agentId: string;
  agentName: string;
  agentVersion: string;
  meetingId: string;
  status: AgentExecutionStatus;
  payload: TOutput;
  overallConfidence: number;
  evidence: EvidenceSource[];
  reasoning: ReasoningMetadata;
  governance: GovernanceMetadata;
  quality: QualityMetrics;
  confidenceDistribution: ConfidenceDistribution;
  createdAt: number;
  errors?: string[];
}

export interface ICognitiveAgent<TInput = any, TOutput = any> {
  id: string;
  name: string;
  version: string;
  description: string;
  requiredCapabilities: string[];
  dependencies: string[];
  execute(input: TInput, context?: Record<string, unknown>): Promise<AgentEvidencePackage<TOutput>>;
}
