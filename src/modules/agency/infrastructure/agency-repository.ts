import type { AgencyRun, AgencyStep } from "../domain/agent-run";
import type { AgencyRunRepo } from "../domain/repositories";

function scopeMatch(a: { tenantId?: string; workspaceId?: string }, tenantId: string, workspaceId: string): boolean {
  return a.tenantId === tenantId && a.workspaceId === workspaceId;
}

export class InMemoryAgencyRunRepo implements AgencyRunRepo {
  private runs = new Map<string, AgencyRun>();
  private steps = new Map<string, AgencyStep>();

  async save(run: AgencyRun): Promise<void> {
    this.runs.set(run.runId, run);
  }

  async get(tenantId: string, workspaceId: string, runId: string): Promise<AgencyRun | null> {
    const run = this.runs.get(runId);
    return run && scopeMatch(run, tenantId, workspaceId) ? run : null;
  }

  async list(tenantId: string, workspaceId: string, filters?: { agentRole?: string; status?: string }): Promise<AgencyRun[]> {
    let list = [...this.runs.values()].filter((run) => scopeMatch(run, tenantId, workspaceId));
    if (filters?.status) {
      list = list.filter((run) => run.status === filters.status);
    }
    if (filters?.agentRole) {
      // Find runs where at least one step was executed by this agentRole
      const stepRunIds = [...this.steps.values()]
        .filter((step) => step.agentRole === filters.agentRole && scopeMatch(step, tenantId, workspaceId))
        .map((step) => step.runId);
      list = list.filter((run) => stepRunIds.includes(run.runId));
    }
    return list.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  async saveStep(step: AgencyStep): Promise<void> {
    this.steps.set(step.stepId, step);
  }

  async getStep(tenantId: string, workspaceId: string, stepId: string): Promise<AgencyStep | null> {
    const step = this.steps.get(stepId);
    return step && scopeMatch(step, tenantId, workspaceId) ? step : null;
  }

  async listSteps(tenantId: string, workspaceId: string, runId: string): Promise<AgencyStep[]> {
    return [...this.steps.values()]
      .filter((step) => step.runId === runId && scopeMatch(step, tenantId, workspaceId))
      .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  }
}
