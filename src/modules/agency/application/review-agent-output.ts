import type { AppContext } from "../../app-context";
import type { AgentHandoff } from "../domain/handoff";
import { QAReviewerImpl } from "../infrastructure/qa-reviewer";
import type { QAReviewResult } from "../domain/ports";

export class ReviewAgentOutput {
  private qaReviewer = new QAReviewerImpl();

  constructor(private readonly ctx: AppContext) {}

  async execute(
    findings: any,
    handoff: AgentHandoff
  ): Promise<{ result: QAReviewResult; tokens: { input: number; output: number }; latencyMs: number }> {
    const res = await this.qaReviewer.review(findings, handoff);
    return {
      result: res.result,
      tokens: { input: res.inputTokens, output: res.outputTokens },
      latencyMs: res.latencyMs,
    };
  }
}
