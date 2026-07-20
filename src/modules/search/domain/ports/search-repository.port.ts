import { CoreQueryPredicate } from "../../../query/domain/ast";

export interface ISearchRepository {
  executeKeywordSearch(
    tenantId: string,
    workspaceId: string,
    keywords: string[],
    objectTypes?: string[],
    limit?: number
  ): Promise<any[]>;

  executeMetadataFilterQuery(
    tenantId: string,
    workspaceId: string,
    predicate?: CoreQueryPredicate,
    objectTypes?: string[]
  ): Promise<any[]>;

  executeRawFetch(
    tenantId: string,
    workspaceId: string,
    objectTypes?: string[]
  ): Promise<any[]>;
}
