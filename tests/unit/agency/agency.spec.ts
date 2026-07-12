import { describe, it, expect } from "vitest";
import { makeContext } from "../../helpers";
import { PlanMeetingAnalysis } from "../../../src/modules/agency/application/plan-meeting-analysis";
import { ExecuteAgentTask } from "../../../src/modules/agency/application/execute-agent-task";
import { ReviewAgentOutput } from "../../../src/modules/agency/application/review-agent-output";
import { estimateCost } from "../../../src/shared/observability/model-pricing";
import type { AgentHandoff } from "../../../src/modules/agency/domain/handoff";

describe("unit: Agency Orchestration Components", () => {
  it("Manager planning generates dynamic step plans, skipping specialists where appropriate", async () => {
    const ctx = makeContext();
    const planner = new PlanMeetingAnalysis(ctx);

    // No risks, no actions transcript should skip both
    const res = await planner.execute("We discussed weather and project status.");
    const steps = res.plan.steps;
    expect(steps.find(s => s.agentRole === "RISK_SPECIALIST")?.skipped).toBe(true);
    expect(steps.find(s => s.agentRole === "ACTION_SPECIALIST")?.skipped).toBe(true);

    // Decisions should also be skipped since no decision keywords exist
    expect(steps.find(s => s.agentRole === "DECISION_SPECIALIST")?.skipped).toBe(true);
    // If all are skipped, QA is skipped
    expect(steps.find(s => s.agentRole === "QA_REVIEWER")?.skipped).toBe(true);
  });

  it("Specialist extraction retrieves proper decisions, actions, and risks", async () => {
    const ctx = makeContext();
    const exec = new ExecuteAgentTask(ctx);

    const handoff: AgentHandoff = {
      fromAgent: "MANAGER",
      toAgent: "DECISION_SPECIALIST",
      runId: "run-1",
      taskId: "task-1",
      relevantContext: "We decided to launch the beta on the 15th.",
      priorFindings: {},
      policyConstraints: [],
      unresolvedQuestions: [],
    };

    const res = await exec.execute("DECISION_SPECIALIST", handoff);
    expect(res.findings.decisions.length).toBeGreaterThan(0);
    expect(res.findings.decisions[0].description).toContain("Launch the beta");
  });

  it("QA review triggers policy violations and need for revision", async () => {
    const ctx = makeContext();
    const reviewer = new ReviewAgentOutput(ctx);

    const handoff: AgentHandoff = {
      fromAgent: "MANAGER",
      toAgent: "QA_REVIEWER",
      runId: "run-1",
      taskId: "task-1",
      relevantContext: "Priya needs to deploy the hotfix immediately. No due date was given.",
      priorFindings: {},
      policyConstraints: [],
      unresolvedQuestions: [],
    };

    const findings = {
      proposedActions: [{ description: "Deploy hotfix.", ownerName: "Priya", dueDate: null, priority: "HIGH" }],
    };

    const res = await reviewer.execute(findings, handoff);
    expect(res.result.approved).toBe(false);
    expect(res.result.reason).toContain("due date");
  });

  it("QA review triggers escalations on unresolved ambiguities", async () => {
    const ctx = makeContext();
    const reviewer = new ReviewAgentOutput(ctx);

    const handoff: AgentHandoff = {
      fromAgent: "MANAGER",
      toAgent: "QA_REVIEWER",
      runId: "run-1",
      taskId: "task-1",
      relevantContext: "Someone needs to fix the broken build. But we don't know who owns the codebase, and no one is available.",
      priorFindings: {},
      policyConstraints: [],
      unresolvedQuestions: [],
    };

    const findings = {
      proposedActions: [{ description: "Fix build.", ownerName: null, dueDate: null, priority: "HIGH" }],
    };

    const res = await reviewer.execute(findings, handoff);
    expect(res.result.approved).toBe(false);
    expect(res.result.escalated).toBe(true);
    expect(res.result.reason).toContain("owner and unavailability");
  });

  it("Model pricing estimates cost correctly and handles fake providers", () => {
    const fakeCost = estimateCost("fake", "fake", 1000, 2000);
    expect(fakeCost).toBe(0.0);

    const realCost = estimateCost("openai", "gpt-4o", 1000, 2000);
    expect(realCost).toBe(1000 / 1000 * 0.005 + 2000 / 1000 * 0.015);
  });
});
