import type { WorkspaceSession, WorkspaceMode } from "../../domain/entities/workspace-session";
import type { IWorkspaceSessionRepository, IWorkspaceProfileRepository, IWorkspaceLayoutRepository } from "../../domain/ports/workspace-repository.port";
import type { PlatformEventBus } from "../../../../platform/events";
import { WORKSPACE_EVENT_TYPES } from "../../domain/events/workspace-events";

export class WorkspaceSessionEngine {
  private currentSession: WorkspaceSession | null = null;

  constructor(
    private sessionRepo: IWorkspaceSessionRepository,
    private profileRepo: IWorkspaceProfileRepository,
    private layoutRepo: IWorkspaceLayoutRepository,
    private eventBus: PlatformEventBus
  ) {}

  public async getOrInitializeSession(tenantId: string, workspaceId: string, userId: string): Promise<WorkspaceSession> {
    let session = await this.sessionRepo.findByUser(tenantId, workspaceId, userId);
    if (!session) {
      session = {
        id: `ws_session_${Date.now()}`,
        tenantId,
        workspaceId,
        userId,
        activeProfileId: "profile_default",
        activeLayoutId: "layout_default",
        mode: "Standard",
        historyStack: [
          { id: "step_init", uri: "workspace://inbox", title: "Inbox", timestamp: Date.now() },
        ],
        historyIndex: 0,
        selection: { selectedObjectIds: [], timestamp: Date.now() },
        pinnedNodeIds: [],
        recentNodeIds: ["workspace://inbox"],
        openedTabs: [{ id: "tab_inbox", title: "Inbox", uri: "workspace://inbox" }],
        activeTabId: "tab_inbox",
        commandHistory: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
      };
      await this.sessionRepo.save(session);
    }
    this.currentSession = session;
    this.eventBus.publish(WORKSPACE_EVENT_TYPES.SESSION_RESTORED, { session });
    return session;
  }

  public getCurrentSession(): WorkspaceSession | null {
    return this.currentSession;
  }

  public async setWorkspaceMode(mode: WorkspaceMode): Promise<void> {
    if (!this.currentSession) return;
    const prev = this.currentSession.mode;
    this.currentSession.mode = mode;
    this.currentSession.updatedAt = Date.now();
    await this.sessionRepo.save(this.currentSession);
    this.eventBus.publish(WORKSPACE_EVENT_TYPES.MODE_CHANGED, { previousMode: prev, newMode: mode });
  }

  public async saveSessionState(): Promise<void> {
    if (this.currentSession) {
      this.currentSession.updatedAt = Date.now();
      await this.sessionRepo.save(this.currentSession);
    }
  }
}
