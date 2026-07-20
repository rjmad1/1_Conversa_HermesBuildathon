import type { CanonicalKnowledgeObject, SearchQuery } from "../../shared/domain/types";

export interface IKnowledgeRepository {
  save(object: CanonicalKnowledgeObject): Promise<void>;
  findById(id: string): Promise<CanonicalKnowledgeObject | null>;
  listByWorkspace(
    tenantId: string,
    workspaceId: string,
    type?: string
  ): Promise<CanonicalKnowledgeObject[]>;
  search(query: SearchQuery): Promise<CanonicalKnowledgeObject[]>;
}

export class InMemoryKnowledgeRepository implements IKnowledgeRepository {
  private store = new Map<string, CanonicalKnowledgeObject>();

  async save(object: CanonicalKnowledgeObject): Promise<void> {
    this.store.set(object.id, { ...object });
  }

  async findById(id: string): Promise<CanonicalKnowledgeObject | null> {
    return this.store.get(id) ?? null;
  }

  async listByWorkspace(
    tenantId: string,
    workspaceId: string,
    type?: string
  ): Promise<CanonicalKnowledgeObject[]> {
    const results: CanonicalKnowledgeObject[] = [];
    for (const item of this.store.values()) {
      if (item.tenantId === tenantId && item.workspaceId === workspaceId) {
        if (!type || item.type === type) {
          results.push(item);
        }
      }
    }
    return results;
  }

  async search(query: SearchQuery): Promise<CanonicalKnowledgeObject[]> {
    const list = await this.listByWorkspace(query.tenantId, query.workspaceId);
    return list.filter((item) => {
      if (query.types && !query.types.includes(item.type)) return false;
      if (query.status && item.status !== query.status) return false;
      if (query.query) {
        const q = query.query.toLowerCase();
        const titleMatch = item.title.toLowerCase().includes(q);
        const bodyMatch = item.body?.toLowerCase().includes(q);
        if (!titleMatch && !bodyMatch) return false;
      }
      return true;
    });
  }
}
