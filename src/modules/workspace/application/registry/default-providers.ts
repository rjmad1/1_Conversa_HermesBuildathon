import type { ExtensionManifest } from "../../../../platform/contracts";
import type { NavigationNode } from "../../domain/value-objects/navigation-node";
import type { CommandManifest } from "../../domain/entities/command-manifest";
import type { WorkspaceSelection } from "../../domain/value-objects/workspace-selection";
import type {
  INavigationProvider,
  ICommandProvider,
  IInspectorSectionProvider,
  InspectorSectionDescriptor,
} from "./provider-contracts";

export class CoreNavigationProvider implements INavigationProvider {
  public id = "provider_core_navigation";
  public state: any = "Active";
  public manifest: ExtensionManifest = {
    id: "ext_core_navigation",
    name: "Core Navigation Provider",
    version: "1.0.0",
    capabilities: ["Navigation"],
    enabledByDefault: true,
  };

  public isEnabled(): boolean {
    return true;
  }

  public async getNavigationNodes(context: Record<string, unknown>): Promise<NavigationNode[]> {
    return [
      { id: "nav_inbox", label: "Inbox", type: "Inbox", icon: "inbox", badge: 3, uri: "workspace://inbox", order: 1 },
      { id: "nav_today", label: "Today", type: "Today", icon: "calendar", uri: "workspace://today", order: 2 },
      { id: "nav_recent", label: "Recent", type: "Recent", icon: "clock", uri: "workspace://recent", order: 3 },
      { id: "nav_favorites", label: "Favorites", type: "Favorites", icon: "star", uri: "workspace://favorites", order: 4 },
      { id: "nav_pinned", label: "Pinned", type: "Pinned", icon: "pin", uri: "workspace://pinned", order: 5 },
      { id: "nav_projects", label: "Projects", type: "Projects", icon: "folder", uri: "workspace://projects", order: 6 },
      { id: "nav_views", label: "Saved Views", type: "Views", icon: "layout", uri: "workspace://views", order: 7 },
      { id: "nav_searches", label: "Saved Searches", type: "SavedSearches", icon: "search", uri: "workspace://searches", order: 8 },
    ];
  }
}

export class CoreCommandProvider implements ICommandProvider {
  public id = "provider_core_commands";
  public state: any = "Active";
  public manifest: ExtensionManifest = {
    id: "ext_core_commands",
    name: "Core Command Provider",
    version: "1.0.0",
    capabilities: ["Command"],
    enabledByDefault: true,
  };

  private executeCallback?: (commandId: string, args?: Record<string, unknown>) => Promise<unknown>;

  constructor(executeCallback?: (commandId: string, args?: Record<string, unknown>) => Promise<unknown>) {
    this.executeCallback = executeCallback;
  }

  public isEnabled(): boolean {
    return true;
  }

  public async getCommands(context: Record<string, unknown>): Promise<CommandManifest[]> {
    return [
      {
        id: "cmd_open_inbox",
        name: "Open Inbox",
        category: "Navigation",
        shortcut: "Ctrl+1",
        providerId: this.id,
        handler: async () => this.executeCallback?.("cmd_open_inbox"),
      },
      {
        id: "cmd_open_search",
        name: "Search Workspace",
        category: "SearchAction",
        shortcut: "Ctrl+K",
        providerId: this.id,
        handler: async () => this.executeCallback?.("cmd_open_search"),
      },
      {
        id: "cmd_toggle_inspector",
        name: "Toggle Inspector",
        category: "ViewAction",
        shortcut: "Ctrl+I",
        providerId: this.id,
        handler: async () => this.executeCallback?.("cmd_toggle_inspector"),
      },
      {
        id: "cmd_switch_focus_mode",
        name: "Enter Focus Mode",
        category: "SystemAction",
        providerId: this.id,
        handler: async () => this.executeCallback?.("cmd_switch_focus_mode"),
      },
    ];
  }
}

export class PlatformInspectorProvider implements IInspectorSectionProvider {
  public id = "provider_platform_inspector";
  public state: any = "Active";
  public manifest: ExtensionManifest = {
    id: "ext_platform_inspector",
    name: "Platform Context Inspector Provider",
    version: "1.0.0",
    capabilities: ["InspectorSection"],
    enabledByDefault: true,
  };

  public isEnabled(): boolean {
    return true;
  }

  public async getInspectorSections(selection: WorkspaceSelection): Promise<InspectorSectionDescriptor[]> {
    if (!selection.focusedObjectId) return [];

    return [
      {
        id: "inspector_metadata",
        title: "Metadata & Properties",
        order: 1,
        renderAsync: async () => ({
          title: "Metadata & Properties",
          items: [
            { label: "ID", value: selection.focusedObjectId! },
            { label: "Type", value: selection.focusedObjectType || "KnowledgeObject" },
            { label: "Status", value: "Active" },
            { label: "Visibility", value: "Workspace" },
          ],
        }),
      },
      {
        id: "inspector_relationships",
        title: "Knowledge Graph Links",
        order: 2,
        renderAsync: async () => ({
          title: "Knowledge Graph Links",
          items: [
            { label: "Parent Project", value: "Conversa Buildout", linkUri: "workspace://projects/p1" },
            { label: "Linked Tasks", value: "3 Tasks", linkUri: "workspace://searches/s1" },
          ],
        }),
      },
      {
        id: "inspector_context",
        title: "AI Context Assembly",
        order: 3,
        renderAsync: async () => ({
          title: "AI Context Assembly",
          items: [
            { label: "Canonical Token Count", value: "1,240 tokens" },
            { label: "Context Platform Rank", value: "0.94 (High Priority)" },
          ],
        }),
      },
    ];
  }
}
