import type { AppContext } from "../../app-context";
import { MeetingManagerImpl } from "../infrastructure/meeting-manager";
import type { AgentPlan } from "../domain/agent-plan";

export class PlanMeetingAnalysis {
  private manager = new MeetingManagerImpl();

  constructor(private readonly ctx: AppContext) {}

  async execute(transcriptContent: string): Promise<{ plan: AgentPlan; tokens: { input: number; output: number }; latencyMs: number }> {
    const res = await this.manager.plan(transcriptContent);
    return {
      plan: res.plan,
      tokens: { input: res.inputTokens, output: res.outputTokens },
      latencyMs: res.latencyMs,
    };
  }
}
