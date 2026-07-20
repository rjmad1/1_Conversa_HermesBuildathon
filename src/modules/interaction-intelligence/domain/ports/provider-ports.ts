/**
 * Persistence & Backend Provider Port Interfaces for Interaction Intelligence Layer.
 * Designed for provider neutrality (In-Memory, Convex, and Future AegisOS).
 */
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
} from "../domain-models";

export interface ISessionMemoryStore {
  saveSession(session: WorkspaceSessionMemory): Promise<void>;
  loadSession(workspaceId: string, userId: string): Promise<WorkspaceSessionMemory | null>;
}

export interface ISpatialHistoryStore {
  saveSnapshot(snapshot: WorkspaceSnapshot): Promise<void>;
  getSnapshot(snapshotId: string): Promise<WorkspaceSnapshot | null>;
  listSnapshots(workspaceId: string, limit?: number): Promise<WorkspaceSnapshot[]>;
}

export interface IContextStackStore {
  saveStack(stack: ContextStack): Promise<void>;
  loadStack(stackId: string): Promise<ContextStack | null>;
}

export interface IEntityPreviewStore {
  getPreview(entityId: string, mode: PreviewMode): Promise<EntityPreviewData | null>;
  savePreview(preview: EntityPreviewData): Promise<void>;
}

export interface IActivityStreamStore {
  appendActivity(item: ActivityItem): Promise<void>;
  getStream(workspaceId: string, limit?: number): Promise<ActivityItem[]>;
  updateActivityStatus(id: string, status: ActivityItem["status"]): Promise<void>;
}

export interface IWorkspaceDNAStore {
  getDNA(workspaceId: string): Promise<WorkspaceDNA | null>;
  saveDNA(dna: WorkspaceDNA): Promise<void>;
}

export interface IPersonaConfigStore {
  getPersonaConfig(personaType: PersonaType): Promise<PersonaConfig | null>;
  savePersonaConfig(config: PersonaConfig): Promise<void>;
}

export interface ICapabilityGateStore {
  getCapabilityLevel(userId: string): Promise<CapabilityLevel>;
  setCapabilityLevel(userId: string, level: CapabilityLevel): Promise<void>;
}

/**
 * Future AegisOS Provider Adapter Interface.
 * Allows replacing Convex/Local backend with AegisOS Kernel services seamlessly.
 */
export interface IAegisOSProviderAdapter {
  providerName: string;
  isAegisAvailable(): Promise<boolean>;
  sessionStore: ISessionMemoryStore;
  spatialStore: ISpatialHistoryStore;
  contextStore: IContextStackStore;
  previewStore: IEntityPreviewStore;
  activityStore: IActivityStreamStore;
  dnaStore: IWorkspaceDNAStore;
}
