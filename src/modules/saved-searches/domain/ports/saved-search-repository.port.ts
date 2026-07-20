import { SavedSearch } from "../entities/saved-search";

export interface ISavedSearchRepository {
  findById(id: string): Promise<SavedSearch | null>;
  findByWorkspace(tenantId: string, workspaceId: string, userId?: string): Promise<SavedSearch[]>;
  save(savedSearch: SavedSearch): Promise<string>;
  delete(id: string): Promise<void>;
  incrementUsage(id: string): Promise<void>;
}
