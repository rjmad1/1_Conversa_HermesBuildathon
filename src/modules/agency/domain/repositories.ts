import type { AgencyRun, AgencyStep } from "./agent-run";

export interface AgencyRunRepo {
  save(run: AgencyRun): Promise<void>;
  get(tenantId: string, workspaceId: string, runId: string): Promise<AgencyRun | null>;
  list(tenantId: string, workspaceId: string, filters?: { agentRole?: string; status?: string }): Promise<AgencyRun[]>;
  saveStep(step: AgencyStep): Promise<void>;
  getStep(tenantId: string, workspaceId: string, stepId: string): Promise<AgencyStep | null>;
  listSteps(tenantId: string, workspaceId: string, runId: string): Promise<AgencyStep[]>;
}
