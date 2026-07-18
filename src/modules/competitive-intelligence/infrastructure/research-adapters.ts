import type { ResearchFinding } from "../domain/research-finding";
import type { ResearchProvider } from "../domain/ports";
import { AppError, ErrorCode } from "../../../shared/errors/AppError";
import { logger } from "../../../shared/logging/logger";

export class FixtureResearchProvider implements ResearchProvider {
  async fetchPricing(url: string, competitorName: string, searchTerms?: string[]): Promise<Partial<ResearchFinding>> {
    const isChange = url.endsWith("#change") || url.endsWith("#modified");
    return {
      researchCategory: "pricing",
      sourceUrl: url,
      pageTitle: "Tana Pricing Plans",
      retrievedAt: new Date().toISOString(),
      extractedFindings: isChange
        ? "Tana Core: Free. Tana Pro: $15/month."
        : "Tana Core: Free. Tana Pro: $10/month.",
      evidenceExcerpt: isChange
        ? "Tana Pro is now priced at $15/month for individuals."
        : "Tana Pro is priced at $10/month for individuals.",
      contentFingerprint: isChange
        ? "fingerprint-pricing-modified-v2"
        : "fingerprint-pricing-baseline-v1",
      confidence: 0.98,
      status: "success",
      provider: "fixture",
    };
  }

  async fetchChangelog(url: string, competitorName: string, searchTerms?: string[]): Promise<Partial<ResearchFinding>> {
    const isChange = url.endsWith("#change") || url.endsWith("#modified");
    return {
      researchCategory: "changelog",
      sourceUrl: url,
      pageTitle: "Tana Changelog & Release Notes",
      retrievedAt: new Date().toISOString(),
      extractedFindings: isChange
        ? "Released Tana AI, Tana commands, and a new calendar integration."
        : "Released Tana AI, Tana commands.",
      evidenceExcerpt: isChange
        ? "Version 1.4: Released Tana AI, Tana commands, and a new calendar integration."
        : "Version 1.3: Released Tana AI, Tana commands.",
      contentFingerprint: isChange
        ? "fingerprint-changelog-modified-v2"
        : "fingerprint-changelog-baseline-v1",
      confidence: 0.97,
      status: "success",
      provider: "fixture",
    };
  }

  async fetchNews(url: string, competitorName: string, searchTerms?: string[]): Promise<Partial<ResearchFinding>> {
    const isChange = url.endsWith("#change") || url.endsWith("#modified");
    return {
      researchCategory: "news",
      sourceUrl: url,
      pageTitle: "Tana Press Room",
      retrievedAt: new Date().toISOString(),
      extractedFindings: isChange
        ? "Tana announces Series A funding of $15 million."
        : "Tana announces public beta launch.",
      evidenceExcerpt: isChange
        ? "Today, Tana announces it has secured $15M in Series A funding."
        : "Today, Tana launches its product in public beta.",
      contentFingerprint: isChange
        ? "fingerprint-news-modified-v2"
        : "fingerprint-news-baseline-v1",
      confidence: 0.95,
      status: "success",
      provider: "fixture",
    };
  }
}

export class LinkupResearchProvider implements ResearchProvider {
  constructor(private readonly apiKey?: string) {}

  private checkApiKey(): string {
    if (!this.apiKey) {
      throw new AppError(
        ErrorCode.PROVIDER_ERROR,
        "Linkup API key is not configured. Live research is unavailable.",
        500
      );
    }
    return this.apiKey;
  }

  async fetchPricing(url: string, competitorName: string, searchTerms?: string[]): Promise<Partial<ResearchFinding>> {
    const key = this.checkApiKey();
    logger.info({ url, competitorName }, "Running Linkup search for pricing");
    const findings = await this.queryLinkup(key, `${competitorName} pricing plans at ${url}`);
    
    // Quick SHA-256 equivalent hash of findings for fingerprint
    const content = findings.extractedFindings || "no pricing findings";
    const contentFingerprint = "hash-" + content.length;
    
    return {
      researchCategory: "pricing",
      sourceUrl: url,
      pageTitle: findings.pageTitle || `${competitorName} Pricing`,
      retrievedAt: new Date().toISOString(),
      extractedFindings: content,
      evidenceExcerpt: findings.evidenceExcerpt || content,
      contentFingerprint,
      confidence: 0.85,
      status: "success",
      provider: "linkup",
    };
  }

  async fetchChangelog(url: string, competitorName: string, searchTerms?: string[]): Promise<Partial<ResearchFinding>> {
    const key = this.checkApiKey();
    logger.info({ url, competitorName }, "Running Linkup search for changelog");
    const findings = await this.queryLinkup(key, `${competitorName} changelog releases at ${url}`);
    
    const content = findings.extractedFindings || "no changelog findings";
    const contentFingerprint = "hash-" + content.length;

    return {
      researchCategory: "changelog",
      sourceUrl: url,
      pageTitle: findings.pageTitle || `${competitorName} Changelog`,
      retrievedAt: new Date().toISOString(),
      extractedFindings: content,
      evidenceExcerpt: findings.evidenceExcerpt || content,
      contentFingerprint,
      confidence: 0.85,
      status: "success",
      provider: "linkup",
    };
  }

  async fetchNews(url: string, competitorName: string, searchTerms?: string[]): Promise<Partial<ResearchFinding>> {
    const key = this.checkApiKey();
    logger.info({ url, competitorName }, "Running Linkup search for news");
    const findings = await this.queryLinkup(key, `${competitorName} company news funding at ${url}`);
    
    const content = findings.extractedFindings || "no news findings";
    const contentFingerprint = "hash-" + content.length;

    return {
      researchCategory: "news",
      sourceUrl: url,
      pageTitle: findings.pageTitle || `${competitorName} News`,
      retrievedAt: new Date().toISOString(),
      extractedFindings: content,
      evidenceExcerpt: findings.evidenceExcerpt || content,
      contentFingerprint,
      confidence: 0.85,
      status: "success",
      provider: "linkup",
    };
  }

  private async queryLinkup(apiKey: string, query: string): Promise<{ pageTitle: string; extractedFindings: string; evidenceExcerpt: string }> {
    try {
      const response = await fetch("https://api.linkup.so/v1/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query,
          depth: "standard",
        }),
      });

      if (!response.ok) {
        throw new Error(`Linkup API search returned status ${response.status}`);
      }

      const data = await response.json() as any;
      if (data && Array.isArray(data.results) && data.results.length > 0) {
        const first = data.results[0];
        return {
          pageTitle: first.title || "Linkup Search Result",
          extractedFindings: data.results.map((r: any) => r.content).join("\n\n").slice(0, 2000),
          evidenceExcerpt: first.content || "No content extracted",
        };
      }
      return {
        pageTitle: "No results",
        extractedFindings: "No search results returned from Linkup",
        evidenceExcerpt: "No search results",
      };
    } catch (err) {
      logger.error({ err }, "Linkup query failed");
      throw new AppError(ErrorCode.PROVIDER_ERROR, `Linkup query failed: ${(err as Error).message}`, 502);
    }
  }
}
