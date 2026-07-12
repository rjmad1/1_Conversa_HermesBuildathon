import type { AudioAsset } from "../../../shared/validation/schemas";

/** Opaque, tenant-scoped audio storage. Raw bytes never stored in DB records. */
export interface AudioStorage {
  buildRef(tenantId: string, workspaceId: string, meetingId: string, assetId: string): string;
  put(ref: string, bytes: Uint8Array, mimeType: string): Promise<void>;
  get(ref: string): Promise<Uint8Array | null>;
  delete(ref: string): Promise<void>;
  exists(ref: string): Promise<boolean>;
}

export interface StorageRefBuilder {
  build(tenantId: string, workspaceId: string, meetingId: string, assetId: string): string;
}

export class TenantScopedRefBuilder implements StorageRefBuilder {
  build(tenantId: string, workspaceId: string, meetingId: string, assetId: string): string {
    return `tenants/${tenantId}/workspaces/${workspaceId}/media/${assetId}`;
  }
}

export type { AudioAsset };
