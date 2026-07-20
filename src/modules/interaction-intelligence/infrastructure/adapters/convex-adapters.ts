/**
 * Convex Persistence Provider Adapters for Interaction Intelligence Layer.
 * Bridges intelligence ports to Convex backend endpoints.
 */
import type {
  ISessionMemoryStore,
  ISpatialHistoryStore,
  IContextStackStore,
  IEntityPreviewStore,
  IActivityStreamStore,
  IWorkspaceDNAStore,
  IPersonaConfigStore,
  ICapabilityGateStore,
} from "../../domain/ports/provider-ports";

import type {
  WorkspaceSessionMemory,
  WorkspaceSnapshot,
  ContextStack,
  EntityPreviewData,
  PreviewMode,
  ActivityItem,
  WorkspaceDNA,
  PersonaConfig,
  PersonaType,
  CapabilityLevel,
} from "../../domain/domain-models";

export class ConvexSessionMemoryStore implements ISessionMemoryStore {
  public async saveSession(session: WorkspaceSessionMemory): Promise<void> {
    // Convex mutation hook invocation point: await convexClient.mutation("workspaceSession:save", { session });
  }

  public async loadSession(workspaceId: string, userId: string): Promise<WorkspaceSessionMemory | null> {
    // Convex query hook invocation point: return await convexClient.query("workspaceSession:get", { workspaceId, userId });
    return null;
  }
}

export class ConvexSpatialHistoryStore implements ISpatialHistoryStore {
  public async saveSnapshot(snapshot: WorkspaceSnapshot): Promise<void> {
    // Convex mutation hook: await convexClient.mutation("spatialHistory:saveSnapshot", { snapshot });
  }

  public async getSnapshot(snapshotId: string): Promise<WorkspaceSnapshot | null> {
    // Convex query hook: return await convexClient.query("spatialHistory:getSnapshot", { snapshotId });
    return null;
  }

  public async listSnapshots(workspaceId: string, limit?: number): Promise<WorkspaceSnapshot[]> {
    return [];
  }
}

export class ConvexContextStackStore implements IContextStackStore {
  public async saveStack(stack: ContextStack): Promise<void> {}
  public async loadStack(stackId: string): Promise<ContextStack | null> {
    return null;
  }
}

export class ConvexEntityPreviewStore implements IEntityPreviewStore {
  public async getPreview(entityId: string, mode: PreviewMode): Promise<EntityPreviewData | null> {
    return null;
  }
  public async savePreview(preview: EntityPreviewData): Promise<void> {}
}

export class ConvexActivityStreamStore implements IActivityStreamStore {
  public async appendActivity(item: ActivityItem): Promise<void> {}
  public async getStream(workspaceId: string, limit?: number): Promise<ActivityItem[]> {
    return [];
  }
  public async updateActivityStatus(id: string, status: ActivityItem["status"]): Promise<void> {}
}

export class ConvexWorkspaceDNAStore implements IWorkspaceDNAStore {
  public async getDNA(workspaceId: string): Promise<WorkspaceDNA | null> {
    return null;
  }
  public async saveDNA(dna: WorkspaceDNA): Promise<void> {}
}

export class ConvexPersonaConfigStore implements IPersonaConfigStore {
  public async getPersonaConfig(personaType: PersonaType): Promise<PersonaConfig | null> {
    return null;
  }
  public async savePersonaConfig(config: PersonaConfig): Promise<void> {}
}

export class ConvexCapabilityGateStore implements ICapabilityGateStore {
  public async getCapabilityLevel(userId: string): Promise<CapabilityLevel> {
    return "Professional";
  }
  public async setCapabilityLevel(userId: string, level: CapabilityLevel): Promise<void> {}
}
