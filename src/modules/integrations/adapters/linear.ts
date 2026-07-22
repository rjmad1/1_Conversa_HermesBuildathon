import { logger } from "../../../shared/logging/logger";

export interface LinearActionPayload {
  title: string;
  description: string;
  ownerName?: string | null;
  dueDate?: string | null;
  teamId?: string;
  priority?: number; // 0 = No priority, 1 = Urgent, 2 = High, 3 = Normal, 4 = Low
  labelIds?: string[];
}

export class LinearFormatAdapter {
  constructor(private readonly apiKey?: string) {}

  /**
   * Format Linear GraphQL Mutation Body
   */
  formatPayload(payload: LinearActionPayload): { query: string; variables: any } {
    const teamId = payload.teamId || "TEAM-DEFAULT";
    const priority = payload.priority ?? 3;

    const fullDescription = payload.ownerName || payload.dueDate
      ? `${payload.description}\n\n**Conversa Action Metadata**:\n- **Assignee**: ${payload.ownerName || "Unassigned"}\n- **Due Date**: ${payload.dueDate || "N/A"}`
      : payload.description;

    const query = `
      mutation CreateLinearIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            identifier
            url
            title
          }
        }
      }
    `;

    const variables = {
      input: {
        teamId,
        title: payload.title,
        description: fullDescription,
        priority,
        dueDate: payload.dueDate || undefined,
        labelIds: payload.labelIds || undefined,
      },
    };

    return { query, variables };
  }

  /**
   * Dispatch GraphQL Request to Linear API
   */
  async dispatch(payload: LinearActionPayload): Promise<{ success: boolean; issueIdentifier?: string; url: string }> {
    const { query, variables } = this.formatPayload(payload);
    logger.info({ teamId: payload.teamId || "TEAM-DEFAULT", title: payload.title }, "Dispatching Linear GraphQL issue creation payload");

    if (!this.apiKey) {
      logger.warn({}, "Linear API key missing. Returning simulated Linear issue payload.");
      const simulatedId = `CONV-${Math.floor(Math.random() * 900 + 100)}`;
      return {
        success: true,
        issueIdentifier: simulatedId,
        url: `https://linear.app/conversa/issue/${simulatedId}`,
      };
    }

    try {
      const res = await fetch("https://api.linear.app/v1/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": this.apiKey,
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!res.ok) {
        const errText = await res.text();
        logger.error({ status: res.status, errText }, "Linear GraphQL dispatch failed");
        return { success: false, url: "" };
      }

      const json = await res.json();
      const issue = json.data?.issueCreate?.issue;
      return {
        success: Boolean(json.data?.issueCreate?.success),
        issueIdentifier: issue?.identifier,
        url: issue?.url || "https://linear.app",
      };
    } catch (err) {
      logger.error({ err }, "Linear dispatch exception");
      return { success: false, url: "" };
    }
  }
}
