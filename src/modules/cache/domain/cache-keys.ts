export interface CacheKeySpec {
  namespace: "planner" | "query" | "context" | "projection" | "metadata";
  workspaceId: string;
  astHash: string;
  rankingProfile?: string;
  contextProfile?: string;
  version?: number;
}

export class CacheKeyGenerator {
  public static generateKey(spec: CacheKeySpec): string {
    const parts = [
      spec.namespace,
      spec.workspaceId,
      spec.astHash,
      spec.rankingProfile || "default",
      spec.contextProfile || "default",
      `v${spec.version || 1}`,
    ];
    return parts.join(":");
  }

  public static hashObject(obj: any): string {
    const str = JSON.stringify(obj || {});
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `hash_${Math.abs(hash).toString(16)}`;
  }
}
