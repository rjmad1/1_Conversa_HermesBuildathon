import type { AgentRole } from "./agent-role";

export interface AgentTask {
  taskId: string;
  runId: string;
  agentRole: AgentRole;
  taskType: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "REJECTED";
  inputContext: string;
  createdAt: string;
}
