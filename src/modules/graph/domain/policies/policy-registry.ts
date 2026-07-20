import type { IGraphValidationPolicy } from "./validation-policy";
import { BoundaryAndExistencePolicy, CardinalityPolicy, TopologyCyclePolicy } from "./validation-policy";

export class GraphPolicyRegistry {
  private static instance: GraphPolicyRegistry;
  private policies: Map<string, IGraphValidationPolicy> = new Map();

  private constructor() {
    // Register default core policies
    this.register(new BoundaryAndExistencePolicy());
    this.register(new CardinalityPolicy());
    this.register(new TopologyCyclePolicy());
  }

  static getInstance(): GraphPolicyRegistry {
    if (!GraphPolicyRegistry.instance) {
      GraphPolicyRegistry.instance = new GraphPolicyRegistry();
    }
    return GraphPolicyRegistry.instance;
  }

  register(policy: IGraphValidationPolicy): void {
    this.policies.set(policy.name, policy);
  }

  getPolicies(): IGraphValidationPolicy[] {
    return Array.from(this.policies.values());
  }

  getPolicy(name: string): IGraphValidationPolicy | undefined {
    return this.policies.get(name);
  }

  clear(): void {
    this.policies.clear();
  }
}
