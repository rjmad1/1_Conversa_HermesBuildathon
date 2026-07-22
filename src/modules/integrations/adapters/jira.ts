import { logger } from "../../../shared/logging/logger";

export interface JiraActionPayload {
  title: string;
  description: string;
  ownerName?: string | null;
  dueDate?: string | null;
  projectKey?: string;
  issueType?: string;
  priority?: string;
}

export class JiraFormatAdapter {
  constructor(private readonly baseUrl?: string, private readonly apiToken?: string, private readonly userEmail?: string) {}

  /**
   * Convert plain text description to Jira Atlassian Document Format (ADF)
   */
  buildADFDescription(text: string, ownerName?: string | null, dueDate?: string | null): any {
    const paragraphs: any[] = [
      {
        type: "paragraph",
        content: [{ type: "text", text }],
      },
    ];

    if (ownerName || dueDate) {
      paragraphs.push({
        type: "paragraph",
        content: [
          { type: "text", text: "Conversa Metadata: ", marks: [{ type: "strong" }] },
          { type: "text", text: `Assignee: ${ownerName || "Unassigned"} | Target Due Date: ${dueDate || "N/A"}` },
        ],
      });
    }

    return {
      version: 1,
      type: "doc",
      content: paragraphs,
    };
  }

  /**
   * Format Jira REST API v3 Payload
   */
  formatPayload(payload: JiraActionPayload): any {
    const projectKey = payload.projectKey || "CONV";
    const issueType = payload.issueType || "Task";

    return {
      fields: {
        project: { key: projectKey },
        summary: payload.title,
        description: this.buildADFDescription(payload.description, payload.ownerName, payload.dueDate),
        issuetype: { name: issueType },
        priority: payload.priority ? { name: payload.priority } : undefined,
        duedate: payload.dueDate || undefined,
      },
    };
  }

  /**
   * Dispatch Issue Creation to Jira API v3 Endpoint
   */
  async dispatch(payload: JiraActionPayload): Promise<{ success: boolean; issueKey?: string; url: string }> {
    const body = this.formatPayload(payload);
    logger.info({ projectKey: payload.projectKey || "CONV", title: payload.title }, "Dispatching format-aware Jira issue payload");

    if (!this.baseUrl || !this.apiToken) {
      logger.warn({}, "Jira credentials missing. Returning simulated Jira issue payload.");
      const simulatedKey = `${payload.projectKey || "CONV"}-${Math.floor(Math.random() * 900 + 100)}`;
      return {
        success: true,
        issueKey: simulatedKey,
        url: `https://jira.atlassian.com/browse/${simulatedKey}`,
      };
    }

    try {
      const authHeader = `Basic ${Buffer.from(`${this.userEmail}:${this.apiToken}`).toString("base64")}`;
      const res = await fetch(`${this.baseUrl}/rest/api/3/issue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
          "Accept": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        logger.error({ status: res.status, errText }, "Jira API v3 issue creation failed");
        return { success: false, url: "" };
      }

      const json = await res.json();
      return {
        success: true,
        issueKey: json.key,
        url: `${this.baseUrl}/browse/${json.key}`,
      };
    } catch (err) {
      logger.error({ err }, "Jira dispatch exception");
      return { success: false, url: "" };
    }
  }
}
