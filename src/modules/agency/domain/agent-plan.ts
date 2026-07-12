import type { AgentRole } from "./agent-role";

export interface AgentPlanStep {
  agentRole: AgentRole;
  taskType: string;
  description: string;
  skipped: boolean;
}

export interface AgentPlan {
  steps: AgentPlanStep[];
}
