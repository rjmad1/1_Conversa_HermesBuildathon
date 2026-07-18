import type { SlackAdapter } from "../domain/ports";
import { logger } from "../../../shared/logging/logger";

export class MockSlackAdapter implements SlackAdapter {
  public posts: Array<{
    competitorName: string;
    timestamp: string;
    materialChanges: string;
    businessImplication: string;
    recommendedResponse: string;
    sourceLinks: string[];
    runId: string;
  }> = [];

  async sendDigest(
    competitorName: string,
    timestamp: string,
    materialChanges: string,
    businessImplication: string,
    recommendedResponse: string,
    sourceLinks: string[],
    runId: string
  ): Promise<{ delivered: boolean; error?: string }> {
    logger.info({ competitorName, runId }, "Mock Slack Adapter posting digest");
    this.posts.push({
      competitorName,
      timestamp,
      materialChanges,
      businessImplication,
      recommendedResponse,
      sourceLinks,
      runId,
    });
    return { delivered: true };
  }
}

export class SlackAdapterImpl implements SlackAdapter {
  constructor(private readonly webhookUrl?: string) {}

  async sendDigest(
    competitorName: string,
    timestamp: string,
    materialChanges: string,
    businessImplication: string,
    recommendedResponse: string,
    sourceLinks: string[],
    runId: string
  ): Promise<{ delivered: boolean; error?: string }> {
    if (!this.webhookUrl) {
      logger.warn({ competitorName, runId }, "Slack Webhook URL not provided. Digest delivery skipped (logged only).");
      return { delivered: false, error: "Slack webhook URL not configured" };
    }

    const payload = {
      text: `*Competitive Intelligence Digest — ${competitorName}*\n` +
            `*Sweep Timestamp:* ${timestamp}\n` +
            `*Material Changes:* ${materialChanges}\n` +
            `*Business Implication:* ${businessImplication}\n` +
            `*Recommended Response:* ${recommendedResponse}\n` +
            `*Sources:* ${sourceLinks.join(", ")}\n` +
            `*Run Log:* /api/v1/intelligence/competitors/${competitorName}/runs (Run ID: ${runId})`
    };

    // Retry configuration (retry up to 2 times for transient network/server errors)
    let attempts = 0;
    const maxAttempts = 3;
    let lastError: Error | null = null;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        const response = await fetch(this.webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Slack API returned error status ${response.status}`);
        }

        logger.info({ competitorName, runId }, "Slack digest delivered successfully");
        return { delivered: true };
      } catch (err) {
        lastError = err as Error;
        logger.error({ err, attempt: attempts }, "Failed to deliver Slack digest, retrying...");
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 500 * attempts)); // Backoff
        }
      }
    }

    return { delivered: false, error: lastError?.message || "Delivery failed after retries" };
  }
}
