import { ISearchRepository } from "../../domain/ports/search-repository.port";
import { ExecutionPlan } from "../planner/search-planner";
import { CanonicalSearchResult, MatchedField } from "../../domain/entities/search-result";
import { RankingProfileRegistry } from "../../domain/ranking/ranking-profiles";
import { CoreQueryCompiler } from "../../../query/domain/compiler";
import { SearchContext } from "../../domain/ranking/ranking-provider.interface";

export class SearchPipeline {
  private compiler = new CoreQueryCompiler();
  private rankingRegistry = new RankingProfileRegistry();

  constructor(private repository: ISearchRepository) {}

  public async execute(
    plan: ExecutionPlan,
    context: SearchContext
  ): Promise<{ results: CanonicalSearchResult[]; totalCount: number }> {
    const ast = plan.normalizedAST;
    let rawItems: any[] = [];

    // 1. Candidate Retrieval from Repository
    if (ast.keywords && ast.keywords.terms.length > 0) {
      rawItems = await this.repository.executeKeywordSearch(
        context.tenantId,
        context.workspaceId,
        ast.keywords.terms,
        ast.coreQuery?.objectTypes
      );
    } else if (ast.coreQuery?.predicate) {
      rawItems = await this.repository.executeMetadataFilterQuery(
        context.tenantId,
        context.workspaceId,
        ast.coreQuery.predicate,
        ast.coreQuery.objectTypes
      );
    } else {
      rawItems = await this.repository.executeRawFetch(
        context.tenantId,
        context.workspaceId,
        ast.coreQuery?.objectTypes
      );
    }

    // 2. Domain Predicate Evaluation
    if (ast.coreQuery?.predicate) {
      rawItems = rawItems.filter((item) => this.compiler.evaluate(item, ast.coreQuery!.predicate!));
    }

    // 3. Score calculation via Ranking Framework
    const scoredResults: CanonicalSearchResult[] = rawItems.map((item) => {
      const { totalScore, breakdown } = this.rankingRegistry.scoreItem(
        item,
        ast,
        context,
        plan.rankingProfile
      );

      const matchedFields: MatchedField[] = [];
      if (ast.keywords && ast.keywords.terms) {
        for (const term of ast.keywords.terms) {
          if ((item.title || "").toLowerCase().includes(term)) {
            matchedFields.push({ field: "title", matchedTerm: term });
          }
          if ((item.summary || "").toLowerCase().includes(term)) {
            matchedFields.push({ field: "summary", matchedTerm: term });
          }
        }
      }

      return {
        id: item.id || item._id,
        objectTypeId: item.type || item.objectTypeId || "KnowledgeObject",
        title: item.title || item.name || "Untitled",
        summary: item.summary || item.description,
        rank: 0,
        score: totalScore,
        breakdown,
        matchedFields,
        highlights: [],
        createdAt: item.createdAt || Date.now(),
        updatedAt: item.updatedAt || Date.now(),
        preview: {
          properties: item.properties || {},
          metadata: item.metadata || {},
        },
      };
    });

    // 4. Sort by relevance score descending
    scoredResults.sort((a, b) => b.score - a.score);

    // Assign rank indices
    scoredResults.forEach((res, idx) => {
      res.rank = idx + 1;
    });

    // 5. Windowing / Pagination
    const totalCount = scoredResults.length;
    const offset = ast.coreQuery?.pagination?.offset || 0;
    const limit = ast.coreQuery?.pagination?.limit || 50;
    const paginated = scoredResults.slice(offset, offset + limit);

    return { results: paginated, totalCount };
  }
}
