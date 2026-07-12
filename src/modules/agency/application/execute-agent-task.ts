import type { AppContext } from "../../app-context";
import type { AgentHandoff } from "../domain/handoff";
import { DecisionSpecialistImpl } from "../infrastructure/decision-specialist";
import { RiskSpecialistImpl } from "../infrastructure/risk-specialist";
import { ActionSpecialistImpl } from "../infrastructure/action-specialist";

export class ExecuteAgentTask {
  private decisionSpec = new DecisionSpecialistImpl();
  private riskSpec = new RiskSpecialistImpl();
  private actionSpec = new ActionSpecialistImpl();

  constructor(private readonly ctx: AppContext) {}

  async execute(
    role: "DECISION_SPECIALIST" | "RISK_SPECIALIST" | "ACTION_SPECIALIST",
    handoff: AgentHandoff
  ): Promise<{ findings: any; tokens: { input: number; output: number }; latencyMs: number }> {
    if (role === "DECISION_SPECIALIST") {
      const res = await this.decisionSpec.extract(handoff);
      return {
        findings: { decisions: res.decisions },
        tokens: { input: res.inputTokens, output: res.outputTokens },
        latencyMs: res.latencyMs,
      };
    } else if (role === "RISK_SPECIALIST") {
      const res = await this.riskSpec.extract(handoff);
      return {
        findings: { risks: res.risks },
        tokens: { input: res.inputTokens, output: res.outputTokens },
        latencyMs: res.latencyMs,
      };
    } else {
      const res = await this.actionSpec.extract(handoff);
      return {
        findings: { proposedActions: res.proposedActions },
        tokens: { input: res.inputTokens, output: res.outputTokens },
        latencyMs: res.latencyMs,
      };
    }
  }
}
