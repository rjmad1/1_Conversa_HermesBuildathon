import type { MeetingAnalysisProvider, AnalyzeInput } from "../../modules/analysis/domain/provider";
import type { MeetingAnalysis } from "../../shared/validation/schemas";
import { logger } from "../../shared/logging/logger";
import { randomUUID } from "node:crypto";

export class AnthropicAnalysisProvider implements MeetingAnalysisProvider {
  readonly name = "anthropic";

  constructor(
    private readonly apiKey?: string,
    private readonly model: string = "claude-3-haiku-20240307"
  ) {}

  async analyze(input: AnalyzeInput): Promise<MeetingAnalysis> {
    if (!this.apiKey) {
      logger.info({}, "Anthropic API key not provided. Returning mock Claude analysis.");
      return {
        id: randomUUID(),
        meetingId: input.meetingId,
        summary: "Fallback Claude Meeting Summary: We resolved all actions.",
        topics: ["fallback", "claude"],
        decisions: [],
        proposedActions: [],
        risks: [],
        createdAt: new Date().toISOString(),
      };
    }

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 4000,
          messages: [
            {
              role: "user",
              content: `Extract structured meeting analysis as JSON matching this schema: { summary: string, topics: string[], decisions: any[], proposedActions: any[], risks: string[] }. Transcript:\n\n${input.transcriptContent}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic HTTP error: ${response.status}`);
      }

      const data = await response.json() as any;
      const text = data.content?.[0]?.text || "{}";
      const parsed = JSON.parse(text);
      
      parsed.id = parsed.id || randomUUID();
      parsed.meetingId = parsed.meetingId || input.meetingId;
      parsed.createdAt = parsed.createdAt || new Date().toISOString();
      
      if (Array.isArray(parsed.decisions)) {
        for (const d of parsed.decisions) {
          d.id = d.id || randomUUID();
          d.meetingId = d.meetingId || input.meetingId;
          d.createdAt = d.createdAt || parsed.createdAt;
        }
      }
      
      if (Array.isArray(parsed.proposedActions)) {
        for (const a of parsed.proposedActions) {
          a.id = a.id || randomUUID();
          a.meetingId = a.meetingId || input.meetingId;
          a.ownerReference = a.ownerReference !== undefined ? a.ownerReference : null;
          a.status = a.status || "PROPOSED";
          a.createdAt = a.createdAt || parsed.createdAt;
          a.updatedAt = a.updatedAt || parsed.createdAt;
        }
      }
      
      return parsed;
    } catch (err) {
      logger.error({ err }, "Anthropic API request failed");
      throw err;
    }
  }
}

export class FailoverAnalysisProvider implements MeetingAnalysisProvider {
  readonly name = "failover";

  constructor(
    private readonly primary: MeetingAnalysisProvider,
    private readonly secondary: MeetingAnalysisProvider
  ) {}

  async analyze(input: AnalyzeInput): Promise<MeetingAnalysis> {
    try {
      logger.info({ primary: this.primary.name }, "Attempting primary model analysis");
      return await this.primary.analyze(input);
    } catch (err) {
      logger.warn(
        { err, primary: this.primary.name, secondary: this.secondary.name },
        "Primary model failed. Performing failover to secondary provider..."
      );
      return await this.secondary.analyze(input);
    }
  }
}
