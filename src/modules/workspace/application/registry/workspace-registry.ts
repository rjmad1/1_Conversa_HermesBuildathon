import { BaseRegistry } from "../../../../platform/registry";
import { ModuleLifecycleManager } from "../../../../platform/lifecycle";
import type { IWorkspaceProvider } from "../../../../platform/contracts";
import type {
  INavigationProvider,
  ICommandProvider,
  IPanelProvider,
  IWidgetProvider,
  IInspectorSectionProvider,
} from "./provider-contracts";

export class WorkspaceRegistry {
  private lifecycleManager = new ModuleLifecycleManager();
  private navigationProviders = new BaseRegistry<INavigationProvider>();
  private commandProviders = new BaseRegistry<ICommandProvider>();
  private panelProviders = new BaseRegistry<IPanelProvider>();
  private widgetProviders = new BaseRegistry<IWidgetProvider>();
  private inspectorProviders = new BaseRegistry<IInspectorSectionProvider>();

  public async registerProvider(provider: IWorkspaceProvider): Promise<void> {
    await this.lifecycleManager.registerProvider(provider);

    if (provider.manifest.capabilities.includes("Navigation")) {
      this.navigationProviders.register(provider as INavigationProvider);
    }
    if (provider.manifest.capabilities.includes("Command")) {
      this.commandProviders.register(provider as ICommandProvider);
    }
    if (provider.manifest.capabilities.includes("Panel")) {
      this.panelProviders.register(provider as IPanelProvider);
    }
    if (provider.manifest.capabilities.includes("Widget")) {
      this.widgetProviders.register(provider as IWidgetProvider);
    }
    if (provider.manifest.capabilities.includes("InspectorSection")) {
      this.inspectorProviders.register(provider as IInspectorSectionProvider);
    }
  }

  public getNavigationProviders(): INavigationProvider[] {
    return this.navigationProviders.getAll().filter((p) => p.state === "Active");
  }

  public getCommandProviders(): ICommandProvider[] {
    return this.commandProviders.getAll().filter((p) => p.state === "Active");
  }

  public getPanelProviders(): IPanelProvider[] {
    return this.panelProviders.getAll().filter((p) => p.state === "Active");
  }

  public getWidgetProviders(): IWidgetProvider[] {
    return this.widgetProviders.getAll().filter((p) => p.state === "Active");
  }

  public getInspectorSectionProviders(): IInspectorSectionProvider[] {
    return this.inspectorProviders.getAll().filter((p) => p.state === "Active");
  }
}
