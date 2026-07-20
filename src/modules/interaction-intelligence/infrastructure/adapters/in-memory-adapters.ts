/**
 * In-Memory persistence provider adapters for testing and local execution.
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

export class InMemorySessionMemoryStore implements ISessionMemoryStore {
  private sessions: Map<string, WorkspaceSessionMemory> = new Map();

  public async saveSession(session: WorkspaceSessionMemory): Promise<void> {
    const key = `${session.workspaceId}:${session.userId}`;
    this.sessions.set(key, session);
  }

  public async loadSession(workspaceId: string, userId: string): Promise<WorkspaceSessionMemory | null> {
    const key = `${workspaceId}:${userId}`;
    return this.sessions.get(key) || null;
  }
}

export class InMemorySpatialHistoryStore implements ISpatialHistoryStore {
  private snapshots: Map<string, WorkspaceSnapshot> = new Map();

  public async saveSnapshot(snapshot: WorkspaceSnapshot): Promise<void> {
    this.snapshots.set(snapshot.snapshotId, snapshot);
  }

  public async getSnapshot(snapshotId: string): Promise<WorkspaceSnapshot | null> {
    return this.snapshots.get(snapshotId) || null;
  }

  public async listSnapshots(workspaceId: string, limit: number = 20): Promise<WorkspaceSnapshot[]> {
    return Array.from(this.snapshots.values())
      .filter((s) => s.workspaceId === workspaceId)
      .slice(-limit);
  }
}

export class InMemoryContextStackStore implements IContextStackStore {
  private stacks: Map<string, ContextStack> = new Map();

  public async saveStack(stack: ContextStack): Promise<void> {
    this.stacks.set(stack.stackId, stack);
  }

  public async loadStack(stackId: string): Promise<ContextStack | null> {
    return this.stacks.get(stackId) || null;
  }
}

export class InMemoryEntityPreviewStore implements IEntityPreviewStore {
  private previews: Map<string, EntityPreviewData> = new Map();

  public async getPreview(entityId: string, mode: PreviewMode): Promise<EntityPreviewData | null> {
    return this.previews.get(`${entityId}:${mode}`) || null;
  }

  public async savePreview(preview: EntityPreviewData): Promise<void> {
    this.previews.set(`${preview.entityId}:${preview.mode}`, preview);
  }
}

export class InMemoryActivityStreamStore implements IActivityStreamStore {
  private stream: ActivityItem[] = [];

  public async appendActivity(item: ActivityItem): Promise<void> {
    this.stream.unshift(item);
  }

  public async getStream(workspaceId: string, limit: number = 50): Promise<ActivityItem[]> {
    return this.stream.slice(0, limit);
  }

  public async updateActivityStatus(id: string, status: ActivityItem["status"]): Promise<void> {
    const item = this.stream.find((a) => a.id === id);
    if (item) {
      item.status = status;
    }
  }
}

export class InMemoryWorkspaceDNAStore implements IWorkspaceDNAStore {
  private dnaMap: Map<string, WorkspaceDNA> = new Map();

  public async getDNA(workspaceId: string): Promise<WorkspaceDNA | null> {
    return this.dnaMap.get(workspaceId) || null;
  }

  public async saveDNA(dna: WorkspaceDNA): Promise<void> {
    this.dnaMap.set(dna.workspaceId, dna);
  }
}

export class InMemoryPersonaConfigStore implements IPersonaConfigStore {
  private configs: Map<PersonaType, PersonaConfig> = new Map();

  public async getPersonaConfig(personaType: PersonaType): Promise<PersonaConfig | null> {
    return this.configs.get(personaType) || null;
  }

  public async savePersonaConfig(config: PersonaConfig): Promise<void> {
    this.configs.set(config.personaType, config);
  }
}

export class InMemoryCapabilityGateStore implements ICapabilityGateStore {
  private gates: Map<string, CapabilityLevel> = new Map();

  public async getCapabilityLevel(userId: string): Promise<CapabilityLevel> {
    return this.gates.get(userId) || "Professional";
  }

  public async setCapabilityLevel(userId: string, level: CapabilityLevel): Promise<void> {
    this.gates.set(userId, level);
  }
}
