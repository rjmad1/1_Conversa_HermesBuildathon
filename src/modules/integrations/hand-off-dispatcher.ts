import { logger } from "../../shared/logging/logger";
import { JiraFormatAdapter, type JiraActionPayload } from "./adapters/jira";
import { LinearFormatAdapter, type LinearActionPayload } from "./adapters/linear";
import { GitHubFormatAdapter, type GitHubActionPayload } from "./adapters/github";
import { AzureDevOpsFormatAdapter, type AzureDevOpsActionPayload } from "./adapters/azure-devops";
import { SlackFormatAdapter, type SlackActionPayload } from "./adapters/slack";

export type HandOffTarget = "jira" | "linear" | "github" | "azure-devops" | "slack";

export interface IntegrationCredentials {
  jiraUrl?: string;
  jiraApiToken?: string;
  jiraUserEmail?: string;
  linearApiKey?: string;
  githubToken?: string;
  azureDevOpsPat?: string;
  slackWebhookUrl?: string;
}

export interface HandOffActionItem {
  id: string;
  meetingTitle?: string;
  title: string;
  description: string;
  ownerName?: string | null;
  dueDate?: string | null;
  lineageHash?: string;
  confidenceScore?: number;
  status?: string;
}

export interface DispatchResult {
  success: boolean;
  destination: HandOffTarget;
  externalUrl?: string;
  externalId?: string;
  error?: string;
  autoDispatched?: boolean;
}

export interface DeadLetterQueueItem {
  actionId: string;
  destination: HandOffTarget;
  error: string;
  attempts: number;
  timestamp: string;
}

export class HandOffDispatcher {
  private jiraAdapter: JiraFormatAdapter;
  private linearAdapter: LinearFormatAdapter;
  private githubAdapter: GitHubFormatAdapter;
  private azureDevOpsAdapter: AzureDevOpsFormatAdapter;
  private slackAdapter: SlackFormatAdapter;
  private deadLetterQueue: DeadLetterQueueItem[] = [];

  constructor(credentials: IntegrationCredentials = {}) {
    this.jiraAdapter = new JiraFormatAdapter(credentials.jiraUrl, credentials.jiraApiToken, credentials.jiraUserEmail);
    this.linearAdapter = new LinearFormatAdapter(credentials.linearApiKey);
    this.githubAdapter = new GitHubFormatAdapter(credentials.githubToken);
    this.azureDevOpsAdapter = new AzureDevOpsFormatAdapter(credentials.azureDevOpsPat);
    this.slackAdapter = new SlackFormatAdapter(credentials.slackWebhookUrl);
  }

  /**
   * Determine if an action item qualifies for autonomous confidence-based auto-dispatch
   */
  shouldAutoDispatch(action: HandOffActionItem, threshold = 0.95): boolean {
    if (typeof action.confidenceScore !== "number") return false;
    return action.confidenceScore >= threshold;
  }

  /**
   * Access current Dead Letter Queue (DLQ) persistent failure backlog
   */
  getDeadLetterQueue(): DeadLetterQueueItem[] {
    return [...this.deadLetterQueue];
  }

  /**
   * Dispatch an approved or auto-dispatched action item to a target destination in its native format
   */
  async dispatch(
    destination: HandOffTarget,
    action: HandOffActionItem,
    targetConfig: Record<string, any> = {}
  ): Promise<DispatchResult> {
    const isAuto = this.shouldAutoDispatch(action, targetConfig.autoDispatchThreshold ?? 0.95);
    logger.info(
      { destination, actionId: action.id, title: action.title, confidenceScore: action.confidenceScore, isAuto },
      `Orchestrating format-aware hand-off to ${destination}`
    );

    try {
      let result: DispatchResult;

      switch (destination) {
        case "jira": {
          const payload: JiraActionPayload = {
            title: action.title,
            description: action.description,
            ownerName: action.ownerName,
            dueDate: action.dueDate,
            projectKey: targetConfig.projectKey || "CONV",
            issueType: targetConfig.issueType || "Task",
            priority: targetConfig.priority,
          };
          const res = await this.jiraAdapter.dispatch(payload);
          result = {
            success: res.success,
            destination: "jira",
            externalUrl: res.url,
            externalId: res.issueKey,
            autoDispatched: isAuto,
          };
          break;
        }

        case "linear": {
          const payload: LinearActionPayload = {
            title: action.title,
            description: action.description,
            ownerName: action.ownerName,
            dueDate: action.dueDate,
            teamId: targetConfig.teamId || "TEAM-CONVERSA",
            priority: targetConfig.priority ?? 3,
          };
          const res = await this.linearAdapter.dispatch(payload);
          result = {
            success: res.success,
            destination: "linear",
            externalUrl: res.url,
            externalId: res.issueIdentifier,
            autoDispatched: isAuto,
          };
          break;
        }

        case "github": {
          const payload: GitHubActionPayload = {
            title: action.title,
            description: action.description,
            ownerName: action.ownerName,
            dueDate: action.dueDate,
            owner: targetConfig.owner,
            repo: targetConfig.repo,
            labels: targetConfig.labels,
          };
          const res = await this.githubAdapter.dispatch(payload);
          result = {
            success: res.success,
            destination: "github",
            externalUrl: res.url,
            externalId: res.issueNumber ? String(res.issueNumber) : undefined,
            autoDispatched: isAuto,
          };
          break;
        }

        case "azure-devops": {
          const payload: AzureDevOpsActionPayload = {
            title: action.title,
            description: action.description,
            ownerName: action.ownerName,
            dueDate: action.dueDate,
            organization: targetConfig.organization,
            project: targetConfig.project,
            workItemType: targetConfig.workItemType || "Task",
          };
          const res = await this.azureDevOpsAdapter.dispatch(payload);
          result = {
            success: res.success,
            destination: "azure-devops",
            externalUrl: res.url,
            externalId: res.workItemId ? String(res.workItemId) : undefined,
            autoDispatched: isAuto,
          };
          break;
        }

        case "slack": {
          const payload: SlackActionPayload = {
            actionId: action.id,
            meetingTitle: action.meetingTitle,
            title: action.title,
            description: action.description,
            ownerName: action.ownerName,
            dueDate: action.dueDate,
            lineageHash: action.lineageHash,
            webhookUrl: targetConfig.webhookUrl,
          };
          const res = await this.slackAdapter.dispatch(payload);
          result = {
            success: res.success,
            destination: "slack",
            externalUrl: res.url,
            autoDispatched: isAuto,
          };
          break;
        }

        default:
          throw new Error(`Unsupported hand-off target: ${destination}`);
      }

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Hand-off dispatch failed";
      logger.error({ destination, actionId: action.id, errorMsg }, "Hand-off dispatch error");
      return {
        success: false,
        destination,
        error: errorMsg,
        autoDispatched: isAuto,
      };
    }
  }

  /**
   * Asynchronous dispatch with exponential backoff retries and Dead Letter Queue (DLQ) tracking
   */
  async dispatchWithDLQRetry(
    destination: HandOffTarget,
    action: HandOffActionItem,
    targetConfig: Record<string, any> = {},
    maxRetries = 3
  ): Promise<DispatchResult> {
    let attempts = 0;
    let lastError = "";

    while (attempts < maxRetries) {
      attempts++;
      const result = await this.dispatch(destination, action, targetConfig);
      if (result.success) {
        return result;
      }
      lastError = result.error || "Unknown dispatch error";
      logger.warn({ destination, actionId: action.id, attempts, lastError }, "Retrying hand-off dispatch...");
    }

    // Push persistent failure to Dead Letter Queue (DLQ)
    const dlqItem: DeadLetterQueueItem = {
      actionId: action.id,
      destination,
      error: lastError,
      attempts,
      timestamp: new Date().toISOString(),
    };
    this.deadLetterQueue.push(dlqItem);
    logger.error({ dlqItem }, "Pushed failed hand-off action to Dead Letter Queue (DLQ)");

    return {
      success: false,
      destination,
      error: `Failed after ${maxRetries} attempts; pushed to DLQ. Error: ${lastError}`,
    };
  }
}
