import type { AgentPlan } from "./agent-plan";

export interface AgencyRun {
  runId: string;
  tenantId: string;
  workspaceId: string;
  meetingId: string;
  startedAt: string;
  completedAt: string | null;
  status: "RUNNING" | "COMPLETED" | "FAILED" | "PAUSED" | "REVISION_REQUIRED" | "ESCALATED";
  plan: AgentPlan;
  totalLatencyMs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCost: number;
  finalOutcome: string | null; // "APPROVED" | "REJECTED" | null
}

export interface AgencyStep {
  stepId: string;
  runId: string;
  tenantId: string;
  workspaceId: string;
  parentStepId: string | null;
  agentRole: string;
  taskType: string;
  startedAt: string;
  completedAt: string | null;
  status: "RUNNING" | "COMPLETED" | "FAILED" | "REJECTED" | "ESCALATED";
  sanitizedInputSummary: string;
  sanitizedOutputSummary: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  revisionCount: number;
  errorCode: string | null;
  escalationReason: string | null;
}
