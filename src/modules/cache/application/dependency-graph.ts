export class DependencyGraph {
  // Map of dependencyTag -> Set of cacheKeys
  private tagToKeys = new Map<string, Set<string>>();
  // Map of cacheKey -> Set of dependencyTags
  private keyToTags = new Map<string, Set<string>>();

  public registerDependency(cacheKey: string, tags: string[]) {
    if (!this.keyToTags.has(cacheKey)) {
      this.keyToTags.set(cacheKey, new Set());
    }
    const keySet = this.keyToTags.get(cacheKey)!;

    for (const tag of tags) {
      keySet.add(tag);
      if (!this.tagToKeys.has(tag)) {
        this.tagToKeys.set(tag, new Set());
      }
      this.tagToKeys.get(tag)!.add(cacheKey);
    }
  }

  public getInvalidationKeys(invalidatedTag: string): string[] {
    const keys = this.tagToKeys.get(invalidatedTag);
    if (!keys) return [];
    return Array.from(keys);
  }

  public removeKey(cacheKey: string) {
    const tags = this.keyToTags.get(cacheKey);
    if (tags) {
      for (const tag of tags) {
        const set = this.tagToKeys.get(tag);
        if (set) {
          set.delete(cacheKey);
          if (set.size === 0) this.tagToKeys.delete(tag);
        }
      }
      this.keyToTags.delete(cacheKey);
    }
  }

  public clear() {
    this.tagToKeys.clear();
    this.keyToTags.clear();
  }
}
