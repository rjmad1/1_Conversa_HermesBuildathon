import type { AgentRole } from "./agent-role";

export interface AgentResult {
  taskId: string;
  runId: string;
  agentRole: AgentRole;
  status: "COMPLETED" | "REJECTED" | "ESCALATED";
  outputSummary: string;
  rawOutput: any;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  revisionCount: number;
  errorCode?: string | null;
  escalationReason?: string | null;
}
