import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FailoverAnalysisProvider, AnthropicAnalysisProvider } from "../../src/infrastructure/providers/anthropic";
import type { MeetingAnalysisProvider, AnalyzeInput } from "../../src/modules/analysis/domain/provider";
import type { MeetingAnalysis } from "../../src/shared/validation/schemas";

describe("Model Failover Integration", () => {
  it("falls back to Anthropic when OpenAI fails", async () => {
    // 1. Setup mock providers
    const mockPrimary: MeetingAnalysisProvider = {
      name: "openai",
      analyze: vi.fn().mockRejectedValue(new Error("OpenAI API rate limit exceeded")),
    };

    const mockSecondaryAnalysis: MeetingAnalysis = {
      id: "anthropic-run-id-1",
      meetingId: "meeting-1",
      summary: "Claude Fallback: Meeting successful.",
      topics: ["fallback"],
      decisions: [],
      proposedActions: [],
      risks: [],
      createdAt: new Date().toISOString(),
    };

    const mockSecondary: MeetingAnalysisProvider = {
      name: "anthropic",
      analyze: vi.fn().mockResolvedValue(mockSecondaryAnalysis),
    };

    const failoverProvider = new FailoverAnalysisProvider(mockPrimary, mockSecondary);

    const input: AnalyzeInput = {
      transcriptContent: "Sprint planning details...",
      language: "en",
      meetingId: "meeting-1",
      correlationId: "corr-1",
    };

    // 2. Run analysis
    const result = await failoverProvider.analyze(input);

    // 3. Assertions
    expect(mockPrimary.analyze).toHaveBeenCalled();
    expect(mockSecondary.analyze).toHaveBeenCalled();
    expect(result.summary).toBe("Claude Fallback: Meeting successful.");
    expect(result.id).toBe("anthropic-run-id-1");
  });
});
