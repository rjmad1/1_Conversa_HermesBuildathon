import { logger } from "../../shared/logging/logger";

export interface GroundingResult {
  query: string;
  urls: string[];
}

export class LinkupGroundingProvider {
  constructor(private readonly apiKey?: string) {}

  async search(query: string): Promise<string[]> {
    if (!query || query.trim() === "") return [];

    if (!this.apiKey) {
      logger.info({ query }, "Linkup API key not provided. Returning mock grounding links.");
      // Return deterministic mock links based on keywords
      const lowered = query.toLowerCase();
      if (lowered.includes("clerk") || lowered.includes("auth")) {
        return ["https://clerk.com/docs/quickstarts/nextjs", "https://clerk.com/docs/backend-requests/resources"];
      }
      if (lowered.includes("convex") || lowered.includes("database")) {
        return ["https://docs.convex.dev/database/schemas", "https://docs.convex.dev/functions/query-functions"];
      }
      if (lowered.includes("slack")) {
        return ["https://api.slack.com/messaging/webhooks", "https://api.slack.com/block-kit"];
      }
      if (lowered.includes("github") || lowered.includes("ci")) {
        return ["https://docs.github.com/en/actions", "https://github.com/features/actions"];
      }
      return [`https://example.com/search?q=${encodeURIComponent(query)}`].slice(0, 1);
    }

    try {
      // Real API call to Linkup
      const response = await fetch("https://api.linkup.so/v1/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query,
          depth: "standard",
        }),
      });

      if (!response.ok) {
        logger.error({ status: response.status }, "Linkup API search returned error status");
        return [];
      }

      const data = await response.json() as any;
      const urls: string[] = [];
      if (data && Array.isArray(data.results)) {
        for (const item of data.results) {
          if (item && typeof item.url === "string") {
            urls.push(item.url);
          }
        }
      }
      return urls.slice(0, 3);
    } catch (err) {
      logger.error({ err }, "Linkup API request failed");
      return [];
    }
  }
}
