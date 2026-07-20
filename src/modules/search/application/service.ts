import { ISearchRepository } from "../domain/ports/search-repository.port";
import { SearchQueryAST } from "../domain/ast/search-ast";
import { CanonicalSearchResult } from "../domain/entities/search-result";
import { SearchPlanner, ExecutionPlan } from "./planner/search-planner";
import { SearchPipeline } from "./pipeline/search-pipeline";
import { SearchContext } from "../domain/ranking/ranking-provider.interface";

export class SearchApplicationService {
  private planner = new SearchPlanner();
  private pipeline: SearchPipeline;

  constructor(private repository: ISearchRepository) {
    this.pipeline = new SearchPipeline(this.repository);
  }

  public plan(query: SearchQueryAST): ExecutionPlan {
    return this.planner.createPlan(query);
  }

  public async execute(
    query: SearchQueryAST,
    context: SearchContext
  ): Promise<{ results: CanonicalSearchResult[]; totalCount: number; plan: ExecutionPlan }> {
    const plan = this.planner.createPlan(query);
    const { results, totalCount } = await this.pipeline.execute(plan, context);
    return { results, totalCount, plan };
  }
}
