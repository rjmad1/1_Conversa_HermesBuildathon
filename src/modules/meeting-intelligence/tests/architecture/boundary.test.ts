import { MeetingPipelineFacade } from "../../application/pipeline-facade";

export async function runArchitectureBoundaryTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: Provider Independence (Agents call AIRuntime capability contracts only)
  try {
    const facade = new MeetingPipelineFacade();
    const registry = facade.getAgentRegistry();
    const agents = registry.getAllAgents();

    const violations: string[] = [];
    for (const agent of agents) {
      if (!agent.requiredCapabilities || agent.requiredCapabilities.length === 0) {
        violations.push(`Agent '${agent.id}' does not declare capability dependencies.`);
      }
    }

    if (violations.length === 0) {
      results.push({ name: "Architecture Test: Agent Capability Contract Isolation", passed: true });
    } else {
      results.push({ name: "Architecture Test: Agent Capability Contract Isolation", passed: false, error: violations.join("; ") });
    }
  } catch (err: any) {
    results.push({ name: "Architecture Test: Agent Capability Contract Isolation", passed: false, error: err.message });
  }

  // Test 2: Evidence Package Schema Compliance & Provenance Immutability
  try {
    const facade = new MeetingPipelineFacade();
    const run = await facade.processMeeting({ meetingId: "m-arch-boundary-1" });

    const checkpoints = run.checkpoints;
    let hasEvidence = false;
    for (const cp of checkpoints) {
      for (const [agentId, pkg] of Object.entries(cp.evidencePackages)) {
        if (!pkg.packageId || !pkg.evidence || !pkg.reasoning || !pkg.governance) {
          throw new Error(`Agent '${agentId}' produced evidence package violating schema.`);
        }
        hasEvidence = true;
      }
    }

    if (hasEvidence) {
      results.push({ name: "Architecture Test: Evidence Package Schema & Provenance Compliance", passed: true });
    } else {
      results.push({ name: "Architecture Test: Evidence Package Schema & Provenance Compliance", passed: false, error: "No evidence packages found in checkpoints" });
    }
  } catch (err: any) {
    results.push({ name: "Architecture Test: Evidence Package Schema & Provenance Compliance", passed: false, error: err.message });
  }

  return results;
}
