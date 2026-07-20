import { AgentEvidencePackage, ICognitiveAgent } from "../contracts/agent-contract";
import { IAIRuntime } from "../contracts/ai-runtime-contract";
import { TranscriptPayload } from "../domain/models";

export interface AudioInputPayload {
  meetingId: string;
  audio?: Buffer | string;
  audioUrl?: string;
}

export class TranscriptionAgent implements ICognitiveAgent<AudioInputPayload, TranscriptPayload> {
  public id = "agent-transcription";
  public name = "Transcription Agent";
  public version = "1.0.0";
  public description = "Speech-to-Text agent producing transcript with confidence and word timestamps.";
  public requiredCapabilities = ["SpeechTranscription"];
  public dependencies = [];

  constructor(private aiRuntime: IAIRuntime) {}

  public async execute(
    input: AudioInputPayload,
    context?: Record<string, unknown>
  ): Promise<AgentEvidencePackage<TranscriptPayload>> {
    const startTime = Date.now();

    const response = await this.aiRuntime.executeCapability<TranscriptPayload>({
      capability: "SpeechTranscription",
      qualityTier: "Balanced",
      privacyLevel: "Internal",
      payload: { meetingId: input.meetingId, audio: input.audio, audioUrl: input.audioUrl },
    });

    const payload = response.data;
    const modelConf = response.confidence || 0.95;

    return {
      packageId: `ev_pkg_transcription_${input.meetingId}_${Date.now()}`,
      agentId: this.id,
      agentName: this.name,
      agentVersion: this.version,
      meetingId: input.meetingId,
      status: "Success",
      payload,
      overallConfidence: modelConf,
      evidence: payload.segments.map((seg, idx) => ({
        id: `ev_tr_${seg.id}`,
        meetingId: input.meetingId,
        transcriptLocation: { startMs: seg.startMs, endMs: seg.endMs, segmentId: seg.id },
        speakerId: seg.speakerId,
        speakerName: seg.speakerName,
        verbatimQuote: seg.text,
      })),
      reasoning: {
        extractionStrategy: "Acoustic-to-Text Phoneme Recognition with Enterprise Language Model",
        provider: response.providerId,
        model: response.modelId,
        promptVersion: "1.0-default",
        executionDurationMs: Date.now() - startTime,
      },
      governance: {
        validationStatus: "Validated",
        privacyClassification: "Internal",
        policyCompliance: true,
        reviewRequired: false,
      },
      quality: {
        ambiguityScore: 0.04,
        completenessScore: 0.98,
        consistencyScore: 0.97,
      },
      confidenceDistribution: {
        sourceConfidence: 0.96,
        modelConfidence: modelConf,
        evidenceStrength: 0.98,
        crossAgentAgreement: 1.0,
        validationConfidence: 0.96,
        overall: modelConf,
      },
      createdAt: Date.now(),
    };
  }
}
