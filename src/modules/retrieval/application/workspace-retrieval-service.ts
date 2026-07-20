import { SearchQueryAST } from "../../search/domain/ast/search-ast";
import { CanonicalSearchResult } from "../../search/domain/entities/search-result";
import { SearchApplicationService } from "../../search/application/service";
import { ISearchRepository } from "../../search/domain/ports/search-repository.port";
import { ContextAssembler } from "../../context/application/context-assembler";
import { CanonicalContext } from "../../context/domain/entities/canonical-context";
import { SavedSearchCatalog } from "../../saved-searches/application/saved-search-catalog";
import { ISavedSearchRepository } from "../../saved-searches/domain/ports/saved-search-repository.port";
import { SavedSearch } from "../../saved-searches/domain/entities/saved-search";
import { CacheCoordinator, CacheKeyGenerator } from "../../cache";

export interface WorkspaceRetrievalRequest {
  tenantId: string;
  workspaceId: string;
  userId?: string;
  queryAST: SearchQueryAST;
  retrievalProfile?: "search" | "search_and_context" | "navigation" | "preview";
}

export interface CanonicalRetrievalResponse {
  results: CanonicalSearchResult[];
  totalCount: number;
  plannerMetrics: {
    executionTimeMs: number;
    planHash: string;
    cacheHit: boolean;
  };
}

export class WorkspaceRetrievalService {
  private searchService: SearchApplicationService;
  private contextAssembler = new ContextAssembler();
  private savedSearchCatalog: SavedSearchCatalog;

  constructor(
    searchRepo: ISearchRepository,
    savedSearchRepo: ISavedSearchRepository
  ) {
    this.searchService = new SearchApplicationService(searchRepo);
    this.savedSearchCatalog = new SavedSearchCatalog(savedSearchRepo);
  }

  public async Search(request: WorkspaceRetrievalRequest): Promise<CanonicalRetrievalResponse> {
    const startTime = Date.now();
    const cache = CacheCoordinator.getInstance();
    const astHash = CacheKeyGenerator.hashObject(request.queryAST);
    const cacheKey = CacheKeyGenerator.generateKey({
      namespace: "query",
      workspaceId: request.workspaceId,
      astHash,
      rankingProfile: request.queryAST.rankingProfile,
      contextProfile: request.queryAST.contextProfile,
    });

    const cached = cache.get<CanonicalRetrievalResponse>(cacheKey);
    if (cached) {
      return {
        ...cached,
        plannerMetrics: {
          ...cached.plannerMetrics,
          executionTimeMs: Date.now() - startTime,
          cacheHit: true,
        },
      };
    }

    const searchContext = {
      tenantId: request.tenantId,
      workspaceId: request.workspaceId,
      userId: request.userId,
      nowMs: Date.now(),
    };

    const { results, totalCount, plan } = await this.searchService.execute(
      request.queryAST,
      searchContext
    );

    // If context assembly is requested, resolve graph context for primary results
    if (request.retrievalProfile === "search_and_context" || request.queryAST.projectionHints?.includeBreadcrumbs) {
      for (const res of results) {
        res.context = this.contextAssembler.assembleContext(
          res,
          [],
          [],
          request.queryAST.contextProfile
        );
      }
    }

    const response: CanonicalRetrievalResponse = {
      results,
      totalCount,
      plannerMetrics: {
        executionTimeMs: Date.now() - startTime,
        planHash: plan.planHash,
        cacheHit: false,
      },
    };

    cache.set(cacheKey, response, 60, [`workspace:${request.workspaceId}`]);
    return response;
  }

  public async ResolveContext(
    rootItem: any,
    profileName?: string,
    rawEdges: any[] = [],
    rawItems: any[] = []
  ): Promise<CanonicalContext> {
    return this.contextAssembler.assembleContext(rootItem, rawEdges, rawItems, profileName);
  }

  public async SearchSuggestions(text: string): Promise<string[]> {
    if (!text || text.trim().length === 0) return [];
    return [`Search for "${text}" in Tasks`, `Search for "${text}" in Meetings`, `Search for "${text}" in Knowledge`];
  }

  public async RecentSearches(
    tenantId: string,
    workspaceId: string,
    userId?: string
  ): Promise<SavedSearch[]> {
    return this.savedSearchCatalog.getFavorites(tenantId, workspaceId, userId);
  }

  public async SavedSearches(
    tenantId: string,
    workspaceId: string,
    userId?: string
  ): Promise<SavedSearch[]> {
    return this.savedSearchCatalog.getAvailableSearches(tenantId, workspaceId, userId);
  }
}
