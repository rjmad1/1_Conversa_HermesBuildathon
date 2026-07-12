import OpenAI from "openai";
import type { AudioTranscriptionProvider, TranscribeInput } from "../../modules/transcription/domain/provider";
import type { MeetingAnalysisProvider, AnalyzeInput } from "../../modules/analysis/domain/provider";
import type { MeetingAnalysis, TranscriptResult } from "../../shared/validation/schemas";
import { MeetingAnalysisSchema } from "../../shared/validation/schemas";
import { AppError, ErrorCode } from "../../shared/errors/AppError";
import { logger } from "../../shared/logging/logger";

type JsonSchema = {
  type: "object";
  properties: Record<string, unknown>;
  required: string[];
  [k: string]: unknown;
};

/**
 * OpenAI-backed providers. Server-side key only. Used in production when
 * TRANSCRIPTION_PROVIDER / ANALYSIS_PROVIDER = 'openai'. Not invoked in tests/CI.
 */
export class OpenAITranscriptionProvider implements AudioTranscriptionProvider {
  readonly name = "openai";
  constructor(
    private readonly client: OpenAI,
    private readonly model: string,
    private readonly timeoutMs: number,
    private readonly maxRetries: number,
  ) {}

  async transcribe(input: TranscribeInput): Promise<TranscriptResult> {
    let attempt = 0;
    while (true) {
      try {
        const res = await this.client.audio.transcriptions.create(
          { file: input.audioRef as unknown as OpenAI.Chat.ChatCompletionCreateParams["messages"], model: this.model } as never,
          { timeout: this.timeoutMs },
        );
        const content = typeof res === "string" ? res : ((res as { text: string }).text ?? "");
        return { language: "en", content, segments: [] };
      } catch {
        attempt++;
        if (attempt > this.maxRetries) {
          logger.error({ correlationId: input.correlationId, operation: "transcribe" }, "transcription failed");
          throw new AppError(ErrorCode.PROVIDER_ERROR, "Transcription provider error", 502, undefined, true);
        }
      }
    }
  }
}

export class OpenAIAnalysisProvider implements MeetingAnalysisProvider {
  readonly name = "openai";
  constructor(
    private readonly client: OpenAI,
    private readonly model: string,
    private readonly timeoutMs: number,
    private readonly maxRetries: number,
  ) {}

  async analyze(input: AnalyzeInput): Promise<MeetingAnalysis> {
    let attempt = 0;
    while (true) {
      try {
        const res = await this.client.chat.completions.create(
          {
            model: this.model,
            temperature: 0,
            response_format: { type: "json_schema", json_schema: { name: "meeting_analysis", schema: analysisJsonSchema() as never } } as never,
            messages: [
              { role: "system", content: "Extract structured meeting analysis as JSON per schema. Do not fabricate owners/dates; use null if unknown." },
              { role: "user", content: input.transcriptContent },
            ],
          },
          { timeout: this.timeoutMs },
        );
        const raw = res.choices[0]?.message?.content ?? "{}";
        const parsed = MeetingAnalysisSchema.safeParse(JSON.parse(raw));
        if (!parsed.success) {
          throw new AppError(ErrorCode.ANALYSIS_FAILED, "Malformed analysis output rejected", 422);
        }
        return parsed.data;
      } catch (err) {
        if (err instanceof AppError) throw err;
        attempt++;
        if (attempt > this.maxRetries) {
          logger.error({ correlationId: input.correlationId, operation: "analyze" }, "analysis failed");
          throw new AppError(ErrorCode.PROVIDER_ERROR, "Analysis provider error", 502, undefined, true);
        }
      }
    }
  }
}

function analysisJsonSchema(): JsonSchema {
  return {
    type: "object",
    properties: {
      summary: { type: "string" },
      topics: { type: "array", items: { type: "string" } },
      decisions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            description: { type: "string" },
            rationale: { type: "string" },
            sourceEvidence: { type: "string" },
            confidence: { type: "number" },
          },
          required: ["description", "rationale", "sourceEvidence", "confidence"],
        },
      },
      proposedActions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            description: { type: "string" },
            ownerName: { type: ["string", "null"] },
            dueDate: { type: ["string", "null"] },
            priority: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
            targetSystem: { type: "string" },
            actionType: { type: "string" },
            rationale: { type: "string" },
            sourceEvidence: { type: "string" },
            confidence: { type: "number" },
            riskLevel: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
          },
          required: ["description", "ownerName", "dueDate", "priority", "targetSystem", "actionType", "rationale", "sourceEvidence", "confidence", "riskLevel"],
        },
      },
      risks: { type: "array", items: { type: "string" } },
    },
    required: ["summary", "topics", "decisions", "proposedActions", "risks"],
  };
}
