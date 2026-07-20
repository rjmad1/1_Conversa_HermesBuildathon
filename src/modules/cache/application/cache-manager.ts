import { DependencyGraph } from "./dependency-graph";

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  createdAt: number;
  ttlMs: number;
  dependencyTags: string[];
}

export class CacheManager {
  private store = new Map<string, CacheEntry>();
  private dependencyGraph = new DependencyGraph();

  public get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() - entry.createdAt > entry.ttlMs) {
      this.evict(key);
      return null;
    }

    return entry.value as T;
  }

  public set<T>(key: string, value: T, ttlSeconds: number = 60, dependencyTags: string[] = []): void {
    const entry: CacheEntry<T> = {
      key,
      value,
      createdAt: Date.now(),
      ttlMs: ttlSeconds * 1000,
      dependencyTags,
    };

    this.store.set(key, entry);
    this.dependencyGraph.registerDependency(key, dependencyTags);
  }

  public invalidateTag(tag: string): number {
    const keys = this.dependencyGraph.getInvalidationKeys(tag);
    for (const k of keys) {
      this.evict(k);
    }
    return keys.length;
  }

  public evict(key: string): void {
    this.store.delete(key);
    this.dependencyGraph.removeKey(key);
  }

  public clear(): void {
    this.store.clear();
    this.dependencyGraph.clear();
  }
}

export class CacheCoordinator {
  private static instance: CacheManager;

  public static getInstance(): CacheManager {
    if (!CacheCoordinator.instance) {
      CacheCoordinator.instance = new CacheManager();
    }
    return CacheCoordinator.instance;
  }
}
