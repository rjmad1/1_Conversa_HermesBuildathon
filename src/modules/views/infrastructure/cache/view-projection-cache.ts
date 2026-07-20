import { CanonicalViewModel } from "../../domain/entities/canonical-view-model";

interface CacheEntry {
  viewModel: CanonicalViewModel;
  cachedAt: number;
  hash: string;
}

export class ViewProjectionCache {
  private cache = new Map<string, CacheEntry>();
  private defaultTtlMs = 60 * 1000; // 1 minute default TTL

  public get(key: string, currentHash: string): CanonicalViewModel | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.cachedAt > this.defaultTtlMs;
    const isStaleHash = entry.hash !== currentHash;

    if (isExpired || isStaleHash) {
      this.cache.delete(key);
      return null;
    }

    return entry.viewModel;
  }

  public set(key: string, hash: string, viewModel: CanonicalViewModel): void {
    this.cache.set(key, {
      viewModel,
      hash,
      cachedAt: Date.now(),
    });
  }

  public invalidate(keyPrefix?: string): void {
    if (!keyPrefix) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.startsWith(keyPrefix)) {
        this.cache.delete(key);
      }
    }
  }
}
