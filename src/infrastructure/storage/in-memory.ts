import type { AudioStorage, StorageRefBuilder } from "../../modules/media/domain/storage";

export class InMemoryAudioStorage implements AudioStorage {
  private blobs = new Map<string, Uint8Array>();
  constructor(private readonly refBuilder: StorageRefBuilder) {}

  buildRef(tenantId: string, workspaceId: string, meetingId: string, assetId: string): string {
    return this.refBuilder.build(tenantId, workspaceId, meetingId, assetId);
  }
  async put(ref: string, bytes: Uint8Array, _mimeType: string): Promise<void> {
    this.blobs.set(ref, bytes);
  }
  async get(ref: string): Promise<Uint8Array | null> {
    return this.blobs.get(ref) ?? null;
  }
  async delete(ref: string): Promise<void> {
    this.blobs.delete(ref);
  }
  async exists(ref: string): Promise<boolean> {
    return this.blobs.has(ref);
  }
}
