import type { IWorkspaceProvider } from "../../../../platform/contracts";
import type { NavigationNode } from "../../domain/value-objects/navigation-node";
import type { CommandManifest } from "../../domain/entities/command-manifest";
import type { PanelConfig } from "../../domain/value-objects/panel-config";
import type { WorkspaceSelection } from "../../domain/value-objects/workspace-selection";

export interface INavigationProvider extends IWorkspaceProvider {
  getNavigationNodes(context: Record<string, unknown>): Promise<NavigationNode[]>;
}

export interface ICommandProvider extends IWorkspaceProvider {
  getCommands(context: Record<string, unknown>): Promise<CommandManifest[]>;
}

export interface IPanelProvider extends IWorkspaceProvider {
  getPanels(context: Record<string, unknown>): Promise<PanelConfig[]>;
}

export interface IWidgetProvider extends IWorkspaceProvider {
  getWidgetDescriptor(widgetId: string): Promise<{ id: string; title: string; component: string } | null>;
  getAvailableWidgets(context: Record<string, unknown>): Promise<{ id: string; title: string; category: string }[]>;
}

export interface InspectorSectionDescriptor {
  id: string;
  title: string;
  order: number;
  renderAsync: (selection: WorkspaceSelection) => Promise<{
    title: string;
    items: { label: string; value: string; type?: string; linkUri?: string }[];
    rawContext?: Record<string, unknown>;
  }>;
}

export interface IInspectorSectionProvider extends IWorkspaceProvider {
  getInspectorSections(selection: WorkspaceSelection): Promise<InspectorSectionDescriptor[]>;
}
