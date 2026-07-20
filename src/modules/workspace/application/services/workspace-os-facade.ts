import { PlatformEventBus } from "../../../../platform/events";
import { WorkspaceRegistry } from "../registry/workspace-registry";
import { CoreNavigationProvider, CoreCommandProvider, PlatformInspectorProvider } from "../registry/default-providers";
import { SelectionBus } from "../engines/selection-bus";
import { InspectorEngine } from "../engines/inspector-engine";
import { LayoutEngine } from "../engines/layout-engine";
import { NavigationEngine } from "../engines/navigation-engine";
import { CommandBus } from "../engines/command-bus";
import { WorkspaceSessionEngine } from "./workspace-session-engine";
import {
  InMemoryWorkspaceSessionRepository,
  InMemoryWorkspaceProfileRepository,
  InMemoryWorkspaceLayoutRepository,
} from "../../infrastructure/repositories/in-memory-workspace-repositories";
import { InteractionIntelligenceFacade } from "../../../interaction-intelligence";
import type { WorkspaceSession, WorkspaceMode } from "../../domain/entities/workspace-session";
import type { WorkspaceLayout } from "../../domain/entities/workspace-layout";
import type { NavigationNode } from "../../domain/value-objects/navigation-node";
import type { CommandManifest } from "../../domain/entities/command-manifest";
import type { WorkspaceSelection } from "../../domain/value-objects/workspace-selection";

export interface OpenObjectOptions {
  inNewTab?: boolean;
  targetObjectType?: string;
  focusInspector?: boolean;
}

export interface OpenViewOptions {
  inNewTab?: boolean;
  viewTitle?: string;
}

export interface NavigationIntent {
  uri: string;
  title: string;
  nodeType?: string;
  stateSnapshot?: Record<string, unknown>;
}

export interface CommandResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export class WorkspaceOSFacade {
  public eventBus: PlatformEventBus;
  public registry: WorkspaceRegistry;
  public selectionBus: SelectionBus;
  public inspectorEngine: InspectorEngine;
  public layoutEngine: LayoutEngine;
  public navigationEngine: NavigationEngine;
  public commandBus: CommandBus;
  public sessionEngine: WorkspaceSessionEngine;
  public intelligence: InteractionIntelligenceFacade;
  public sessionRepo: InMemoryWorkspaceSessionRepository;
  public profileRepo: InMemoryWorkspaceProfileRepository;
  public layoutRepo: InMemoryWorkspaceLayoutRepository;

  constructor() {
    this.eventBus = new PlatformEventBus();
    this.intelligence = new InteractionIntelligenceFacade(this.eventBus);
    this.registry = new WorkspaceRegistry();
    this.selectionBus = new SelectionBus(this.eventBus);
    this.inspectorEngine = new InspectorEngine(this.registry, this.selectionBus);

    this.sessionRepo = new InMemoryWorkspaceSessionRepository();
    this.profileRepo = new InMemoryWorkspaceProfileRepository();
    this.layoutRepo = new InMemoryWorkspaceLayoutRepository();

    this.sessionEngine = new WorkspaceSessionEngine(
      this.sessionRepo,
      this.profileRepo,
      this.layoutRepo,
      this.eventBus
    );

    this.navigationEngine = new NavigationEngine(this.registry, this.eventBus);
    this.commandBus = new CommandBus(this.registry, this.eventBus);

    // Default layout fallback
    const defaultLayout: WorkspaceLayout = {
      id: "layout_default",
      name: "Standard Double Panel Split",
      profileId: "profile_default",
      panels: [],
      mainSplitRatio: 0.65,
      sidebarWidth: 260,
      inspectorWidth: 320,
      isSidebarCollapsed: false,
      isInspectorCollapsed: false,
      openTabs: [{ id: "tab_inbox", title: "Inbox", uri: "workspace://inbox", type: "Inbox" }],
      activeMainTabId: "tab_inbox",
      updatedAt: Date.now(),
    };
    this.layoutEngine = new LayoutEngine(defaultLayout, this.eventBus);

    this.registerDefaultProviders();
  }

  private registerDefaultProviders() {
    this.registry.registerProvider(new CoreNavigationProvider());
    this.registry.registerProvider(
      new CoreCommandProvider(async (cmdId) => {
        if (cmdId === "cmd_open_inbox") {
          await this.navigate({ uri: "workspace://inbox", title: "Inbox", nodeType: "Inbox" });
        } else if (cmdId === "cmd_toggle_inspector") {
          this.layoutEngine.toggleInspector();
        } else if (cmdId === "cmd_switch_focus_mode") {
          await this.sessionEngine.setWorkspaceMode("Focus");
        }
        return { executed: true };
      })
    );
    this.registry.registerProvider(new PlatformInspectorProvider());
  }

  public async initialize(tenantId: string, workspaceId: string, userId: string): Promise<WorkspaceSession> {
    await this.intelligence.initialize(tenantId, workspaceId, userId);
    const session = await this.sessionEngine.getOrInitializeSession(tenantId, workspaceId, userId);
    const layout = await this.layoutRepo.findById(session.activeLayoutId);
    if (layout) {
      this.layoutEngine.setLayout(layout);
    }
    return session;
  }

  // --- API 1: OpenObject() ---
  public async openObject(objectId: string, options: OpenObjectOptions = {}): Promise<void> {
    const session = this.sessionEngine.getCurrentSession();
    const uri = `workspace://objects/${objectId}`;
    const title = options.targetObjectType ? `${options.targetObjectType}: ${objectId}` : `Object (${objectId})`;

    this.selectionBus.setSelection({
      focusedObjectId: objectId,
      focusedObjectType: options.targetObjectType || "KnowledgeObject",
      selectedObjectIds: [objectId],
    });

    if (options.inNewTab !== false) {
      this.layoutEngine.openTab({
        id: `tab_obj_${objectId}`,
        title,
        uri,
        type: options.targetObjectType || "Object",
      });
    }

    if (session) {
      this.navigationEngine.navigateTo(session, { uri, title, nodeType: "Object" });
      await this.sessionEngine.saveSessionState();
    }
  }

  // --- API 2: OpenView() ---
  public async openView(viewId: string, options: OpenViewOptions = {}): Promise<void> {
    const session = this.sessionEngine.getCurrentSession();
    const uri = `workspace://views/${viewId}`;
    const title = options.viewTitle || `View (${viewId})`;

    this.selectionBus.setSelection({
      activeViewId: viewId,
    });

    if (options.inNewTab !== false) {
      this.layoutEngine.openTab({
        id: `tab_view_${viewId}`,
        title,
        uri,
        type: "View",
      });
    }

    if (session) {
      this.navigationEngine.navigateTo(session, { uri, title, nodeType: "View" });
      await this.sessionEngine.saveSessionState();
    }
  }

  // --- API 3: Navigate() ---
  public async navigate(intent: NavigationIntent): Promise<void> {
    const session = this.sessionEngine.getCurrentSession();
    if (session) {
      this.navigationEngine.navigateTo(session, intent);
      this.layoutEngine.openTab({
        id: `tab_nav_${Date.now()}`,
        title: intent.title,
        uri: intent.uri,
        type: intent.nodeType || "Navigation",
      });
      await this.sessionEngine.saveSessionState();
    }
  }

  // --- API 4: ExecuteCommand() ---
  public async executeCommand(commandId: string, args?: Record<string, unknown>): Promise<CommandResult> {
    try {
      const data = await this.commandBus.execute(commandId, args, {
        session: this.sessionEngine.getCurrentSession(),
        selection: this.selectionBus.getSelection(),
      });
      return { success: true, data };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  // --- API 5: ResolveWorkspace() ---
  public async resolveWorkspace(workspaceId: string): Promise<WorkspaceSession | null> {
    return this.sessionEngine.getCurrentSession();
  }

  // --- API 6: ResolveLayout() ---
  public async resolveLayout(profileId: string, mode?: WorkspaceMode): Promise<WorkspaceLayout> {
    return this.layoutEngine.getLayout();
  }

  // --- API 7: ResolveNavigation() ---
  public async resolveNavigation(profileId: string): Promise<NavigationNode[]> {
    return this.navigationEngine.getDynamicNavigationTree({ profileId });
  }

  // --- Selection Bus Helpers ---
  public setSelection(selection: Partial<WorkspaceSelection>): void {
    this.selectionBus.setSelection(selection);
  }

  public getSelection(): WorkspaceSelection {
    return this.selectionBus.getSelection();
  }

  public subscribeSelection(callback: (selection: WorkspaceSelection) => void): () => void {
    return this.selectionBus.subscribe(callback);
  }
}
