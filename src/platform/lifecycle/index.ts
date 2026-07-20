import type { IWorkspaceProvider } from "../contracts";

export class ModuleLifecycleManager {
  private providers: Map<string, IWorkspaceProvider> = new Map();

  public async registerProvider(provider: IWorkspaceProvider): Promise<void> {
    provider.state = "Registered";
    this.providers.set(provider.id, provider);

    if (provider.initialize) {
      provider.state = "Validating";
      try {
        await provider.initialize();
      } catch (err) {
        provider.state = "Error";
        console.error(`[ModuleLifecycleManager] Failed to initialize provider '${provider.id}':`, err);
        return;
      }
    }

    if (provider.manifest.enabledByDefault !== false) {
      await this.activateProvider(provider.id);
    }
  }

  public async activateProvider(providerId: string): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) return false;

    if (provider.activate) {
      try {
        await provider.activate();
      } catch (err) {
        provider.state = "Error";
        console.error(`[ModuleLifecycleManager] Failed to activate provider '${providerId}':`, err);
        return false;
      }
    }

    provider.state = "Active";
    return true;
  }

  public async deactivateProvider(providerId: string): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) return false;

    if (provider.deactivate) {
      try {
        await provider.deactivate();
      } catch (err) {
        console.error(`[ModuleLifecycleManager] Failed to deactivate provider '${providerId}':`, err);
      }
    }

    provider.state = "Deactivated";
    return true;
  }

  public getActiveProviders(): IWorkspaceProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.state === "Active");
  }
}
