import {
  CapabilityRequest,
  CapabilityResponse,
  IAIRuntime,
  ICapabilityRouter,
  IProviderAdapter
} from "../contracts/ai-runtime-contract";
import { CapabilityRouter } from "./capability-router";

export class AIRuntime implements IAIRuntime {
  private providers: Map<string, IProviderAdapter> = new Map();
  private router: ICapabilityRouter;

  constructor(router?: ICapabilityRouter) {
    this.router = router || new CapabilityRouter();
  }

  public registerProvider(provider: IProviderAdapter): void {
    this.providers.set(provider.id, provider);
  }

  public unregisterProvider(providerId: string): void {
    this.providers.delete(providerId);
  }

  public getRegisteredProviders(): IProviderAdapter[] {
    return Array.from(this.providers.values());
  }

  public async executeCapability<TData = any>(
    request: CapabilityRequest
  ): Promise<CapabilityResponse<TData>> {
    const available = this.getRegisteredProviders();
    if (available.length === 0) {
      throw new Error(`[AIRuntime] No AI providers registered to fulfill '${request.capability}'.`);
    }

    const decision = this.router.selectProvider(request, available);
    const provider = this.providers.get(decision.selectedProviderId);

    if (!provider) {
      throw new Error(`[AIRuntime] Router selected provider '${decision.selectedProviderId}', but it is not registered.`);
    }

    return provider.executeCapability<TData>(request);
  }

  public async executeWithFailover<TData = any>(
    request: CapabilityRequest
  ): Promise<CapabilityResponse<TData>> {
    const available = this.getRegisteredProviders();
    if (available.length === 0) {
      throw new Error(`[AIRuntime] No providers registered for failover execution.`);
    }

    const errors: string[] = [];
    for (const provider of available) {
      if (provider.supportsCapability(request.capability, request.qualityTier)) {
        try {
          return await provider.executeCapability<TData>(request);
        } catch (err: any) {
          errors.push(`Provider '${provider.id}' failed: ${err.message || String(err)}`);
        }
      }
    }

    throw new Error(`[AIRuntime] Failover exhausted for capability '${request.capability}'. Errors: ${errors.join("; ")}`);
  }
}
