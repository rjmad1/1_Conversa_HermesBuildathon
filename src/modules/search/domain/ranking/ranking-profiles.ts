import { IRankingStrategy, IRankingProvider, SearchContext } from "./ranking-provider.interface";
import { SearchQueryAST } from "../ast/search-ast";
import {
  KeywordRankingProvider,
  MetadataRankingProvider,
  GraphProximityProvider,
  RecencyProvider,
  TypeBoostProvider,
} from "./providers";

export class WeightedSumStrategy implements IRankingStrategy {
  public readonly name = "weightedSum";

  public aggregate(scores: Map<string, number>, weights: Map<string, number>): number {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const [providerName, score] of scores.entries()) {
      const weight = weights.get(providerName) ?? 0.2;
      weightedSum += score * weight;
      totalWeight += weight;
    }

    if (totalWeight === 0) return 0.5;
    return Math.min(1.0, Math.max(0.0, weightedSum / totalWeight));
  }
}

export interface RankingProfileConfig {
  name: string;
  strategy: IRankingStrategy;
  weights: Map<string, number>;
}

export class RankingProfileRegistry {
  private profiles = new Map<string, RankingProfileConfig>();
  private providers = new Map<string, IRankingProvider>();

  constructor() {
    // Register default providers
    this.registerProvider(new KeywordRankingProvider());
    this.registerProvider(new MetadataRankingProvider());
    this.registerProvider(new GraphProximityProvider());
    this.registerProvider(new RecencyProvider());
    this.registerProvider(new TypeBoostProvider());

    const defaultStrategy = new WeightedSumStrategy();

    // 1. WorkspaceSearch
    this.profiles.set("WorkspaceSearch", {
      name: "WorkspaceSearch",
      strategy: defaultStrategy,
      weights: new Map([
        ["keyword", 0.35],
        ["metadata", 0.25],
        ["typeBoost", 0.15],
        ["recency", 0.15],
        ["graphProximity", 0.10],
      ]),
    });

    // 2. CommandPalette
    this.profiles.set("CommandPalette", {
      name: "CommandPalette",
      strategy: defaultStrategy,
      weights: new Map([
        ["keyword", 0.60],
        ["typeBoost", 0.20],
        ["recency", 0.20],
      ]),
    });

    // 3. AIContext
    this.profiles.set("AIContext", {
      name: "AIContext",
      strategy: defaultStrategy,
      weights: new Map([
        ["graphProximity", 0.40],
        ["metadata", 0.30],
        ["keyword", 0.20],
        ["recency", 0.10],
      ]),
    });

    // 4. Navigation
    this.profiles.set("Navigation", {
      name: "Navigation",
      strategy: defaultStrategy,
      weights: new Map([
        ["recency", 0.50],
        ["graphProximity", 0.30],
        ["keyword", 0.20],
      ]),
    });
  }

  public registerProvider(provider: IRankingProvider) {
    this.providers.set(provider.name, provider);
  }

  public getProfile(name?: string): RankingProfileConfig {
    return this.profiles.get(name || "WorkspaceSearch") || this.profiles.get("WorkspaceSearch")!;
  }

  public scoreItem(
    item: any,
    query: SearchQueryAST,
    context: SearchContext,
    profileName?: string
  ): { totalScore: number; breakdown: Record<string, number> } {
    const profile = this.getProfile(profileName || query.rankingProfile);
    const breakdown: Record<string, number> = {};
    const scores = new Map<string, number>();

    for (const [providerName] of profile.weights.entries()) {
      const provider = this.providers.get(providerName);
      if (provider) {
        const score = provider.calculateScore(item, query, context);
        scores.set(providerName, score);
        breakdown[providerName] = Math.round(score * 100) / 100;
      }
    }

    const totalScore = profile.strategy.aggregate(scores, profile.weights);
    return {
      totalScore: Math.round(totalScore * 100) / 100,
      breakdown,
    };
  }
}
