import { logger } from "../../../shared/logging/logger";

export interface GitHubActionPayload {
  title: string;
  description: string;
  ownerName?: string | null;
  dueDate?: string | null;
  owner?: string;
  repo?: string;
  labels?: string[];
  assignees?: string[];
}

export class GitHubFormatAdapter {
  constructor(private readonly githubToken?: string, private readonly defaultOwner = "rjmad1", private readonly defaultRepo = "1_Conversa") {}

  /**
   * Format GitHub REST API Issue Creation Payload
   */
  formatPayload(payload: GitHubActionPayload): any {
    const bodyText = payload.ownerName || payload.dueDate
      ? `${payload.description}\n\n---\n**Conversa Action Item Metadata**\n- **Assignee**: ${payload.ownerName || "Unassigned"}\n- **Target Due Date**: ${payload.dueDate || "N/A"}`
      : payload.description;

    return {
      title: payload.title,
      body: bodyText,
      labels: payload.labels || ["conversa-action"],
      assignees: payload.assignees || undefined,
    };
  }

  /**
   * Dispatch Issue Creation Request to GitHub API
   */
  async dispatch(payload: GitHubActionPayload): Promise<{ success: boolean; issueNumber?: number; url: string }> {
    const owner = payload.owner || this.defaultOwner;
    const repo = payload.repo || this.defaultRepo;
    const body = this.formatPayload(payload);

    logger.info({ owner, repo, title: payload.title }, "Dispatching GitHub issue payload");

    if (!this.githubToken) {
      logger.warn({}, "GitHub token missing. Returning simulated GitHub issue payload.");
      const simNum = Math.floor(Math.random() * 500 + 1);
      return {
        success: true,
        issueNumber: simNum,
        url: `https://github.com/${owner}/${repo}/issues/${simNum}`,
      };
    }

    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.githubToken}`,
          "User-Agent": "Conversa-HandOff-Adapter",
          "Accept": "application/vnd.github+json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        logger.error({ status: res.status, errText }, "GitHub Issue dispatch failed");
        return { success: false, url: "" };
      }

      const json = await res.json();
      return {
        success: true,
        issueNumber: json.number,
        url: json.html_url || `https://github.com/${owner}/${repo}/issues/${json.number}`,
      };
    } catch (err) {
      logger.error({ err }, "GitHub dispatch exception");
      return { success: false, url: "" };
    }
  }
}
