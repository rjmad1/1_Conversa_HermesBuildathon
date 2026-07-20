import type { WorkspaceSession } from "../entities/workspace-session";
import type { WorkspaceProfile } from "../entities/workspace-profile";
import type { WorkspaceLayout } from "../entities/workspace-layout";

export interface IWorkspaceSessionRepository {
  findById(id: string): Promise<WorkspaceSession | null>;
  findByUser(tenantId: string, workspaceId: string, userId: string): Promise<WorkspaceSession | null>;
  save(session: WorkspaceSession): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IWorkspaceProfileRepository {
  findById(id: string): Promise<WorkspaceProfile | null>;
  findAll(): Promise<WorkspaceProfile[]>;
  save(profile: WorkspaceProfile): Promise<void>;
}

export interface IWorkspaceLayoutRepository {
  findById(id: string): Promise<WorkspaceLayout | null>;
  save(layout: WorkspaceLayout): Promise<void>;
}
