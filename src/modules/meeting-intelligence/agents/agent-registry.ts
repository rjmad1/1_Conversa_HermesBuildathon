import { ICognitiveAgent } from "../contracts/agent-contract";

export class AgentRegistry {
  private agents: Map<string, ICognitiveAgent> = new Map();

  public register(agent: ICognitiveAgent): void {
    this.agents.set(agent.id, agent);
  }

  public unregister(agentId: string): void {
    this.agents.delete(agentId);
  }

  public getAgent(agentId: string): ICognitiveAgent | undefined {
    return this.agents.get(agentId);
  }

  public getAllAgents(): ICognitiveAgent[] {
    return Array.from(this.agents.values());
  }

  public getAgentsByCapability(capability: string): ICognitiveAgent[] {
    return this.getAllAgents().filter((a) => a.requiredCapabilities.includes(capability));
  }

  public clear(): void {
    this.agents.clear();
  }
}
