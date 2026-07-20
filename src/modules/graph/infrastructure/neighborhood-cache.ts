import type { GraphEdgeData } from "../domain/types";

export interface CachedNeighborhood {
  nodeId: string;
  depth: number;
  edges: GraphEdgeData[];
  cachedAt: number;
  version: number;
}

export class NeighborhoodCache {
  private cache = new Map<string, CachedNeighborhood>(); // key: `${tenantId}:${workspaceId}:${nodeId}:${depth}`
  private ttlMs: number;

  constructor(ttlMs = 60000) {
    this.ttlMs = ttlMs;
  }

  private buildKey(tenantId: string, workspaceId: string, nodeId: string, depth: number): string {
    return `${tenantId}:${workspaceId}:${nodeId}:${depth}`;
  }

  get(tenantId: string, workspaceId: string, nodeId: string, depth: number): GraphEdgeData[] | null {
    const key = this.buildKey(tenantId, workspaceId, nodeId, depth);
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.cachedAt > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.edges;
  }

  set(tenantId: string, workspaceId: string, nodeId: string, depth: number, edges: GraphEdgeData[]): void {
    const key = this.buildKey(tenantId, workspaceId, nodeId, depth);
    this.cache.set(key, {
      nodeId,
      depth,
      edges: [...edges],
      cachedAt: Date.now(),
      version: 1,
    });
  }

  invalidateNode(tenantId: string, workspaceId: string, nodeId: string): void {
    const prefix = `${tenantId}:${workspaceId}:${nodeId}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}
