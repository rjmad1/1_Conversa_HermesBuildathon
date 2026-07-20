import { IRankingProvider, SearchContext } from "../ranking-provider.interface";
import { SearchQueryAST } from "../../ast/search-ast";

export class KeywordRankingProvider implements IRankingProvider {
  public readonly name = "keyword";

  public calculateScore(item: any, query: SearchQueryAST, context: SearchContext): number {
    if (!query.keywords || query.keywords.terms.length === 0) return 0.5;

    const text = `${item.title || ""} ${item.summary || ""} ${item.body || ""}`.toLowerCase();
    const terms = query.keywords.terms.map((t) => t.toLowerCase());

    let matchCount = 0;
    let exactTitleMatch = false;

    for (const term of terms) {
      if (text.includes(term)) {
        matchCount++;
      }
      if ((item.title || "").toLowerCase() === term) {
        exactTitleMatch = true;
      }
    }

    const termRatio = matchCount / terms.length;
    let score = termRatio * 0.8;
    if (exactTitleMatch) score += 0.2;

    return Math.min(1.0, score);
  }
}

export class MetadataRankingProvider implements IRankingProvider {
  public readonly name = "metadata";

  public calculateScore(item: any, query: SearchQueryAST, context: SearchContext): number {
    const meta = item.metadata || {};
    const keys = Object.keys(meta);
    if (keys.length === 0) return 0.5;

    // Items with verified or complete metadata score higher
    let score = 0.5;
    if (meta.status === "approved" || meta.verified === true) score += 0.3;
    if (meta.importance === "high") score += 0.2;
    return Math.min(1.0, score);
  }
}

export class GraphProximityProvider implements IRankingProvider {
  public readonly name = "graphProximity";

  public calculateScore(item: any, query: SearchQueryAST, context: SearchContext): number {
    const rels = item.relationships || [];
    if (rels.length === 0) return 0.3;

    // Items with richer graph connections score higher
    const score = 0.3 + Math.min(0.7, rels.length * 0.15);
    return Math.min(1.0, score);
  }
}

export class RecencyProvider implements IRankingProvider {
  public readonly name = "recency";

  public calculateScore(item: any, query: SearchQueryAST, context: SearchContext): number {
    const time = item.updatedAt || item.createdAt;
    if (!time) return 0.5;

    const ageMs = context.nowMs - (typeof time === "number" ? time : new Date(time).getTime());
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    if (ageDays <= 1) return 1.0;
    if (ageDays <= 7) return 0.85;
    if (ageDays <= 30) return 0.65;
    if (ageDays <= 90) return 0.45;
    return 0.25;
  }
}

export class TypeBoostProvider implements IRankingProvider {
  public readonly name = "typeBoost";

  public calculateScore(item: any, query: SearchQueryAST, context: SearchContext): number {
    const type = item.type || item.objectTypeId;
    if (!type) return 0.5;

    if (query.boosts) {
      const match = query.boosts.find((b) => b.field === "type" || b.field === "objectTypeId");
      if (match) return Math.min(1.0, 0.5 * match.boostFactor);
    }
    return 0.5;
  }
}
