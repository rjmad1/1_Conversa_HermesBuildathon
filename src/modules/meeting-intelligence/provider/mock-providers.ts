import {
  AICapability,
  CapabilityRequest,
  CapabilityResponse,
  ILLMProvider,
  ISpeechProvider,
  ProviderCapabilityDescriptor,
  QualityTier
} from "../contracts/ai-runtime-contract";
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

export class MockSpeechProvider implements ISpeechProvider {
  public id = "provider-mock-speech";
  public name = "Mock Enterprise Speech Provider";
  public version = "1.0.0";

  public getCapabilities(): ProviderCapabilityDescriptor[] {
    return [
      {
        capability: "SpeechTranscription",
        supportedQualityTiers: ["Fast", "Balanced", "Premium"],
        costPerAudioMinute: 0.006,
        privacySupported: ["Public", "Internal", "Confidential", "Restricted", "Regulated"],
        isAvailable: true,
      },
      {
        capability: "SpeakerDiarization",
        supportedQualityTiers: ["Balanced", "Premium"],
        costPerAudioMinute: 0.004,
        privacySupported: ["Public", "Internal", "Confidential", "Restricted", "Regulated"],
        isAvailable: true,
      },
    ];
  }

  public supportsCapability(capability: AICapability, qualityTier?: QualityTier): boolean {
    const descs = this.getCapabilities();
    return descs.some((d) => d.capability === capability && d.isAvailable);
  }

  public async transcribeAudio(
    audioBuffer: Buffer | string,
    options?: Record<string, unknown>
  ): Promise<{
    transcript: string;
    confidence: number;
    words: Array<{ word: string; startMs: number; endMs: number; confidence: number }>;
  }> {
    const text =
      "Welcome team to our Q3 Architecture Alignment meeting. Today Sarah will review the Living Workspace module, Alex will present the DB migration risks, and Jordan will commit to the API refactoring schedule before Friday.";
    const words = text.split(" ").map((w, idx) => ({
      word: w,
      startMs: idx * 400,
      endMs: (idx + 1) * 400 - 50,
      confidence: 0.96,
    }));

    return { transcript: text, confidence: 0.96, words };
  }

  public async diarizeAudio(
    audioBuffer: Buffer | string,
    options?: Record<string, unknown>
  ): Promise<{
    segments: Array<{ speakerId: string; speakerName?: string; startMs: number; endMs: number; confidence: number }>;
  }> {
    return {
      segments: [
        { speakerId: "spk_1", speakerName: "Sarah (Engineering Lead)", startMs: 0, endMs: 4000, confidence: 0.95 },
        { speakerId: "spk_2", speakerName: "Alex (Database Architect)", startMs: 4000, endMs: 8000, confidence: 0.92 },
        { speakerId: "spk_3", speakerName: "Jordan (API Principal)", startMs: 8000, endMs: 12000, confidence: 0.94 },
      ],
    };
  }

  public async executeCapability<TData = any>(
    request: CapabilityRequest
  ): Promise<CapabilityResponse<TData>> {
    const startTime = Date.now();
    const meetingId = (request.payload.meetingId as string) || "m-synthetic-1";

    if (request.capability === "SpeechTranscription") {
      const res = await this.transcribeAudio(request.payload.audio as string || "dummy_audio");
      const payload: TranscriptPayload = {
        meetingId,
        fullText: res.transcript,
        durationMs: 12000,
        wordCount: res.words.length,
        overallConfidence: res.confidence,
        segments: [
          {
            id: "seg_1",
            speakerId: "spk_1",
            speakerName: "Sarah (Engineering Lead)",
            startMs: 0,
            endMs: 4000,
            text: "Welcome team to our Q3 Architecture Alignment meeting.",
            confidence: 0.96,
          },
          {
            id: "seg_2",
            speakerId: "spk_2",
            speakerName: "Alex (Database Architect)",
            startMs: 4000,
            endMs: 8000,
            text: "Today Sarah will review the Living Workspace module, Alex will present the DB migration risks,",
            confidence: 0.94,
          },
          {
            id: "seg_3",
            speakerId: "spk_3",
            speakerName: "Jordan (API Principal)",
            startMs: 8000,
            endMs: 12000,
            text: "and Jordan will commit to the API refactoring schedule before Friday.",
            confidence: 0.95,
          },
        ],
      };

      return {
        requestId: `req_speech_${Date.now()}`,
        capability: request.capability,
        providerId: this.id,
        modelId: "whisper-v3-enterprise",
        data: payload as unknown as TData,
        executionTimeMs: Date.now() - startTime,
        confidence: 0.96,
      };
    } else if (request.capability === "SpeakerDiarization") {
      const diar = await this.diarizeAudio(request.payload.audio as string || "dummy_audio");
      const payload: SpeakerTimelinePayload = {
        meetingId,
        overallConfidence: 0.94,
        speakers: [
          { id: "spk_1", name: "Sarah (Engineering Lead)", totalSpeakingTimeMs: 4000, turnCount: 1 },
          { id: "spk_2", name: "Alex (Database Architect)", totalSpeakingTimeMs: 4000, turnCount: 1 },
          { id: "spk_3", name: "Jordan (API Principal)", totalSpeakingTimeMs: 4000, turnCount: 1 },
        ],
        timeline: diar.segments.map((s) => ({
          speakerId: s.speakerId,
          speakerName: s.speakerName,
          startMs: s.startMs,
          endMs: s.endMs,
          confidence: s.confidence,
        })),
      };

      return {
        requestId: `req_diar_${Date.now()}`,
        capability: request.capability,
        providerId: this.id,
        modelId: "pyannote-v3-enterprise",
        data: payload as unknown as TData,
        executionTimeMs: Date.now() - startTime,
        confidence: 0.94,
      };
    }

    throw new Error(`[MockSpeechProvider] Unsupported capability '${request.capability}'.`);
  }
}

export class MockLLMProvider implements ILLMProvider {
  public id = "provider-mock-llm";
  public name = "Mock Enterprise Cognitive Reasoning Provider";
  public version = "1.0.0";

  public getCapabilities(): ProviderCapabilityDescriptor[] {
    const caps: AICapability[] = [
      "TopicSegmentation",
      "EntityExtraction",
      "DecisionExtraction",
      "ActionExtraction",
      "RiskDetection",
      "KnowledgeMapping",
      "DeepReasoning",
      "ConsensusGeneration",
    ];

    return caps.map((c) => ({
      capability: c,
      supportedQualityTiers: ["Fast", "Balanced", "Premium", "Reasoning"],
      costPer1kTokens: 0.0015,
      privacySupported: ["Public", "Internal", "Confidential", "Restricted", "Regulated"],
      isAvailable: true,
    }));
  }

  public supportsCapability(capability: AICapability, qualityTier?: QualityTier): boolean {
    return this.getCapabilities().some((c) => c.capability === capability && c.isAvailable);
  }

  public async generateStructuredOutput<T = any>(
    prompt: string,
    systemPrompt?: string,
    options?: { qualityTier?: QualityTier; temperature?: number; maxTokens?: number }
  ): Promise<{ data: T; rawText: string; tokensUsed: number; confidence: number }> {
    return {
      data: {} as T,
      rawText: "Mock structured response",
      tokensUsed: 420,
      confidence: 0.92,
    };
  }

  public async executeCapability<TData = any>(
    request: CapabilityRequest
  ): Promise<CapabilityResponse<TData>> {
    const startTime = Date.now();
    const meetingId = (request.payload.meetingId as string) || "m-synthetic-1";

    let dataResult: any = {};
    let confidence = 0.92;

    switch (request.capability) {
      case "TopicSegmentation": {
        const topics: TopicSegmentationPayload = {
          meetingId,
          overallConfidence: 0.94,
          topics: [
            {
              id: "top_1",
              title: "Q3 Living Workspace Architecture Review",
              description: "Sarah presented progress and milestones for Living Workspace module.",
              startMs: 0,
              endMs: 4000,
              subtopics: [{ title: "Module State", summary: "Completed and verified", startMs: 0, endMs: 2000 }],
              keywords: ["Living Workspace", "Architecture", "Review"],
              confidence: 0.95,
            },
            {
              id: "top_2",
              title: "Database Migration Risks",
              description: "Alex outlined schema evolution and zero-downtime migration constraints.",
              startMs: 4000,
              endMs: 8000,
              subtopics: [{ title: "Schema locks", summary: "Potential lock escalation under load", startMs: 4000, endMs: 6000 }],
              keywords: ["Database", "Migration", "Lock"],
              confidence: 0.92,
            },
            {
              id: "top_3",
              title: "API Refactoring Commitments",
              description: "Jordan committed to finalizing API refactoring schedule before Friday.",
              startMs: 8000,
              endMs: 12000,
              subtopics: [{ title: "API Schedule", summary: "Due Friday", startMs: 8000, endMs: 12000 }],
              keywords: ["API", "Refactoring", "Schedule"],
              confidence: 0.95,
            },
          ],
        };
        dataResult = topics;
        confidence = 0.94;
        break;
      }
      case "DecisionExtraction": {
        const decisions: DecisionExtractionPayload = {
          meetingId,
          overallConfidence: 0.93,
          decisions: [
            {
              id: "dec_1",
              title: "Approve Living Workspace Phase 1",
              description: "Formally approved Living Workspace module implementation.",
              status: "Approved",
              owner: "Sarah (Engineering Lead)",
              rationale: "All architecture and domain requirements were verified.",
              quote: "Welcome team to our Q3 Architecture Alignment meeting.",
              startMs: 0,
              endMs: 4000,
              confidence: 0.95,
            },
          ],
        };
        dataResult = decisions;
        confidence = 0.93;
        break;
      }
      case "ActionExtraction": {
        const actions: ActionExtractionPayload = {
          meetingId,
          overallConfidence: 0.95,
          actions: [
            {
              id: "act_1",
              title: "Finalize API Refactoring Schedule",
              description: "Jordan will publish the complete API refactoring roadmap and delivery timeline.",
              owner: "Jordan (API Principal)",
              dueDate: "2026-07-24",
              priority: "High",
              dependencies: ["Living Workspace Domain Models"],
              quote: "Jordan will commit to the API refactoring schedule before Friday.",
              startMs: 8000,
              endMs: 12000,
              confidence: 0.96,
            },
          ],
        };
        dataResult = actions;
        confidence = 0.95;
        break;
      }
      case "RiskDetection": {
        const risks: RiskPayload = {
          meetingId,
          overallConfidence: 0.91,
          risks: [
            {
              id: "risk_1",
              category: "Risk",
              description: "Database migration table locking under high concurrent meeting uploads.",
              impact: "High",
              mitigationSuggestion: "Use non-blocking online schema migration tool with read replica failover.",
              quote: "Alex will present the DB migration risks,",
              startMs: 4000,
              endMs: 8000,
              confidence: 0.91,
            },
          ],
        };
        dataResult = risks;
        confidence = 0.91;
        break;
      }
      case "KnowledgeMapping": {
        const mappings: KnowledgeMappingPayload = {
          meetingId,
          overallConfidence: 0.94,
          mappings: [
            {
              id: "kmap_1",
              entityType: "Project",
              entityId: "proj-living-workspace",
              entityName: "Living Workspace Layer",
              relationshipType: "Modifies",
              confidence: 0.95,
              provenanceQuote: "Sarah will review the Living Workspace module",
            },
            {
              id: "kmap_2",
              entityType: "User",
              entityId: "usr-jordan",
              entityName: "Jordan (API Principal)",
              relationshipType: "Mentions",
              confidence: 0.96,
              provenanceQuote: "Jordan will commit to the API refactoring schedule",
            },
          ],
        };
        dataResult = mappings;
        confidence = 0.94;
        break;
      }
      case "ConsensusGeneration":
      case "DeepReasoning": {
        const consensus: ConsensusSummary = {
          meetingId,
          executiveSummary: "The team aligned on Living Workspace architecture, identified database migration locking risks, and secured Jordan's commitment to finalize API refactoring by Friday.",
          keyDecisions: ["Approve Living Workspace Phase 1"],
          criticalActions: ["Jordan to submit API Refactoring schedule by Friday"],
          topRisks: ["Database migration lock escalation under load"],
          consensusConfidence: 0.94,
        };
        dataResult = consensus;
        confidence = 0.94;
        break;
      }
      default:
        throw new Error(`[MockLLMProvider] Unsupported capability '${request.capability}'.`);
    }

    return {
      requestId: `req_llm_${Date.now()}`,
      capability: request.capability,
      providerId: this.id,
      modelId: "gemini-3.5-flash-enterprise",
      data: dataResult as TData,
      executionTimeMs: Date.now() - startTime,
      tokensUsed: 380,
      estimatedCostUsd: 0.00057,
      confidence,
    };
  }
}
