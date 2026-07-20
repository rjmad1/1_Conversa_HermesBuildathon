import type { WorkspaceRegistry } from "../registry/workspace-registry";
import type { NavigationNode } from "../../domain/value-objects/navigation-node";
import type { NavigationStackItem, WorkspaceSession } from "../../domain/entities/workspace-session";
import type { PlatformEventBus } from "../../../../platform/events";
import { WORKSPACE_EVENT_TYPES } from "../../domain/events/workspace-events";

export class NavigationEngine {
  constructor(
    private registry: WorkspaceRegistry,
    private eventBus: PlatformEventBus
  ) {}

  public async getDynamicNavigationTree(context: Record<string, unknown>): Promise<NavigationNode[]> {
    const providers = this.registry.getNavigationProviders();
    const allNodes: NavigationNode[] = [];

    for (const provider of providers) {
      if (provider.isEnabled(context)) {
        try {
          const nodes = await provider.getNavigationNodes(context);
          allNodes.push(...nodes);
        } catch (err) {
          console.error(`[NavigationEngine] Error fetching navigation nodes from ${provider.id}:`, err);
        }
      }
    }

    allNodes.sort((a, b) => (a.order || 99) - (b.order || 99));
    return allNodes;
  }

  public navigateTo(
    session: WorkspaceSession,
    item: { uri: string; title: string; nodeType?: string; stateSnapshot?: Record<string, unknown> }
  ): void {
    const newItem: NavigationStackItem = {
      id: `nav_step_${Date.now()}`,
      uri: item.uri,
      title: item.title,
      nodeType: item.nodeType,
      stateSnapshot: item.stateSnapshot,
      timestamp: Date.now(),
    };

    // Trim forward stack if navigating after going back
    if (session.historyIndex < session.historyStack.length - 1) {
      session.historyStack = session.historyStack.slice(0, session.historyIndex + 1);
    }

    session.historyStack.push(newItem);
    session.historyIndex = session.historyStack.length - 1;
    session.updatedAt = Date.now();

    // Add to recents
    if (!session.recentNodeIds.includes(item.uri)) {
      session.recentNodeIds.unshift(item.uri);
      if (session.recentNodeIds.length > 20) session.recentNodeIds.pop();
    }

    this.eventBus.publish(WORKSPACE_EVENT_TYPES.NAVIGATION_TRANSITION, {
      fromUri: session.historyStack[session.historyIndex - 1]?.uri,
      toUri: item.uri,
      title: item.title,
    });
  }

  public navigateBack(session: WorkspaceSession): NavigationStackItem | null {
    if (session.historyIndex > 0) {
      session.historyIndex--;
      session.updatedAt = Date.now();
      const current = session.historyStack[session.historyIndex];
      this.eventBus.publish(WORKSPACE_EVENT_TYPES.NAVIGATION_TRANSITION, {
        toUri: current?.uri ?? "",
        title: current?.title,
      });
      return current ?? null;
    }
    return null;
  }

  public navigateForward(session: WorkspaceSession): NavigationStackItem | null {
    if (session.historyIndex < session.historyStack.length - 1) {
      session.historyIndex++;
      session.updatedAt = Date.now();
      const current = session.historyStack[session.historyIndex];
      this.eventBus.publish(WORKSPACE_EVENT_TYPES.NAVIGATION_TRANSITION, {
        toUri: current?.uri ?? "",
        title: current?.title,
      });
      return current ?? null;
    }
    return null;
  }
}
