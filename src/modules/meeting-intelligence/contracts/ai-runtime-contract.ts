import { PrivacyClassification } from "./agent-contract";

export type QualityTier = "Fast" | "Balanced" | "Premium" | "Reasoning";
export type CostBudget = "LowestCost" | "Balanced" | "Premium" | "Unlimited";
export type LatencyTier = "Interactive" | "Background" | "Batch";

export type AICapability =
  | "SpeechTranscription"
  | "SpeakerDiarization"
  | "LanguageDetection"
  | "TopicSegmentation"
  | "EntityExtraction"
  | "DecisionExtraction"
  | "ActionExtraction"
  | "RiskDetection"
  | "KnowledgeMapping"
  | "DeepReasoning"
  | "ConsensusGeneration"
  | "VectorEmbedding";

export interface CapabilityRequest {
  capability: AICapability;
  qualityTier?: QualityTier;
  costBudget?: CostBudget;
  privacyLevel?: PrivacyClassification;
  latencyTier?: LatencyTier;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface CapabilityResponse<TData = any> {
  requestId: string;
  capability: AICapability;
  providerId: string;
  modelId: string;
  data: TData;
  executionTimeMs: number;
  tokensUsed?: number;
  estimatedCostUsd?: number;
  confidence: number;
}

export interface ProviderCapabilityDescriptor {
  capability: AICapability;
  supportedQualityTiers: QualityTier[];
  costPer1kTokens?: number;
  costPerAudioMinute?: number;
  privacySupported: PrivacyClassification[];
  isAvailable: boolean;
}

export interface IProviderAdapter {
  id: string;
  name: string;
  version: string;
  getCapabilities(): ProviderCapabilityDescriptor[];
  supportsCapability(capability: AICapability, qualityTier?: QualityTier): boolean;
  executeCapability<TData = any>(request: CapabilityRequest): Promise<CapabilityResponse<TData>>;
}

export interface ISpeechProvider extends IProviderAdapter {
  transcribeAudio(audioBuffer: Buffer | string, options?: Record<string, unknown>): Promise<{
    transcript: string;
    confidence: number;
    words: Array<{ word: string; startMs: number; endMs: number; confidence: number }>;
  }>;
  diarizeAudio(audioBuffer: Buffer | string, options?: Record<string, unknown>): Promise<{
    segments: Array<{ speakerId: string; speakerName?: string; startMs: number; endMs: number; confidence: number }>;
  }>;
}

export interface ILLMProvider extends IProviderAdapter {
  generateStructuredOutput<T = any>(
    prompt: string,
    systemPrompt?: string,
    options?: { qualityTier?: QualityTier; temperature?: number; maxTokens?: number }
  ): Promise<{ data: T; rawText: string; tokensUsed: number; confidence: number }>;
}

export interface RoutingDecision {
  selectedProviderId: string;
  selectedModelId: string;
  estimatedCostUsd: number;
  routingReason: string;
}

export interface ICapabilityRouter {
  selectProvider(request: CapabilityRequest, availableProviders: IProviderAdapter[]): RoutingDecision;
}

export interface IAIRuntime {
  registerProvider(provider: IProviderAdapter): void;
  unregisterProvider(providerId: string): void;
  getRegisteredProviders(): IProviderAdapter[];
  executeCapability<TData = any>(request: CapabilityRequest): Promise<CapabilityResponse<TData>>;
  executeWithFailover<TData = any>(request: CapabilityRequest): Promise<CapabilityResponse<TData>>;
}
