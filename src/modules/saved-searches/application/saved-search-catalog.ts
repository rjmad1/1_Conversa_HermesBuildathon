import { ISavedSearchRepository } from "../domain/ports/saved-search-repository.port";
import { SavedSearch } from "../domain/entities/saved-search";

export class SavedSearchCatalog {
  constructor(private repository: ISavedSearchRepository) {}

  public async getAvailableSearches(
    tenantId: string,
    workspaceId: string,
    userId?: string
  ): Promise<SavedSearch[]> {
    return this.repository.findByWorkspace(tenantId, workspaceId, userId);
  }

  public async getFavorites(
    tenantId: string,
    workspaceId: string,
    userId?: string
  ): Promise<SavedSearch[]> {
    const list = await this.getAvailableSearches(tenantId, workspaceId, userId);
    return list.filter((s) => s.isFavorite);
  }

  public async getByCategory(
    tenantId: string,
    workspaceId: string,
    category: string,
    userId?: string
  ): Promise<SavedSearch[]> {
    const list = await this.getAvailableSearches(tenantId, workspaceId, userId);
    return list.filter((s) => s.category?.toLowerCase() === category.toLowerCase());
  }

  public async saveSearch(search: SavedSearch): Promise<string> {
    return this.repository.save(search);
  }

  public async recordExecution(id: string): Promise<void> {
    await this.repository.incrementUsage(id);
  }
}
