import type {
  IWorkspaceSessionRepository,
  IWorkspaceProfileRepository,
  IWorkspaceLayoutRepository,
} from "../../domain/ports/workspace-repository.port";
import type { WorkspaceSession } from "../../domain/entities/workspace-session";
import type { WorkspaceProfile } from "../../domain/entities/workspace-profile";
import type { WorkspaceLayout } from "../../domain/entities/workspace-layout";

export class InMemoryWorkspaceSessionRepository implements IWorkspaceSessionRepository {
  private sessions = new Map<string, WorkspaceSession>();

  public async findById(id: string): Promise<WorkspaceSession | null> {
    const s = this.sessions.get(id);
    return s ? JSON.parse(JSON.stringify(s)) : null;
  }

  public async findByUser(tenantId: string, workspaceId: string, userId: string): Promise<WorkspaceSession | null> {
    for (const s of this.sessions.values()) {
      if (s.tenantId === tenantId && s.workspaceId === workspaceId && s.userId === userId) {
        return JSON.parse(JSON.stringify(s));
      }
    }
    return null;
  }

  public async save(session: WorkspaceSession): Promise<void> {
    this.sessions.set(session.id, JSON.parse(JSON.stringify(session)));
  }

  public async delete(id: string): Promise<void> {
    this.sessions.delete(id);
  }
}

export class InMemoryWorkspaceProfileRepository implements IWorkspaceProfileRepository {
  private profiles = new Map<string, WorkspaceProfile>();

  constructor() {
    this.seedDefaultProfiles();
  }

  public async findById(id: string): Promise<WorkspaceProfile | null> {
    const p = this.profiles.get(id);
    return p ? JSON.parse(JSON.stringify(p)) : null;
  }

  public async findAll(): Promise<WorkspaceProfile[]> {
    return Array.from(this.profiles.values()).map((p) => JSON.parse(JSON.stringify(p)));
  }

  public async save(profile: WorkspaceProfile): Promise<void> {
    this.profiles.set(profile.id, JSON.parse(JSON.stringify(profile)));
  }

  private seedDefaultProfiles() {
    const defaultProfile: WorkspaceProfile = {
      id: "profile_default",
      name: "Personal Knowledge Profile",
      role: "Personal",
      scope: "User",
      defaultLayoutId: "layout_default",
      enabledNavigationTypes: ["Inbox", "Today", "Recent", "Favorites", "Pinned", "Projects", "Views", "SavedSearches"],
      enabledWidgets: ["recent_activity", "quick_capture"],
      inspectorSections: ["inspector_metadata", "inspector_relationships", "inspector_context"],
      commandCategories: ["Navigation", "SearchAction", "ViewAction", "SystemAction"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.profiles.set(defaultProfile.id, defaultProfile);
  }
}

export class InMemoryWorkspaceLayoutRepository implements IWorkspaceLayoutRepository {
  private layouts = new Map<string, WorkspaceLayout>();

  constructor() {
    this.seedDefaultLayout();
  }

  public async findById(id: string): Promise<WorkspaceLayout | null> {
    const l = this.layouts.get(id);
    return l ? JSON.parse(JSON.stringify(l)) : null;
  }

  public async save(layout: WorkspaceLayout): Promise<void> {
    this.layouts.set(layout.id, JSON.parse(JSON.stringify(layout)));
  }

  private seedDefaultLayout() {
    const defaultLayout: WorkspaceLayout = {
      id: "layout_default",
      name: "Standard Double Panel Split",
      profileId: "profile_default",
      panels: [
        { id: "panel_sidebar", type: "Sidebar", title: "Navigation Tree", dockState: "Expanded", sidebarWidth: 260 } as any,
        { id: "panel_main", type: "Main", title: "Main Workspace", dockState: "Expanded" } as any,
        { id: "panel_inspector", type: "Inspector", title: "Universal Inspector", dockState: "Expanded", inspectorWidth: 320 } as any,
      ],
      mainSplitRatio: 0.65,
      sidebarWidth: 260,
      inspectorWidth: 320,
      isSidebarCollapsed: false,
      isInspectorCollapsed: false,
      openTabs: [
        { id: "tab_inbox", title: "Inbox", uri: "workspace://inbox", type: "Inbox" },
      ],
      activeMainTabId: "tab_inbox",
      updatedAt: Date.now(),
    };
    this.layouts.set(defaultLayout.id, defaultLayout);
  }
}
