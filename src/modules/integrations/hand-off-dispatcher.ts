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
}

export interface DispatchResult {
  success: boolean;
  destination: HandOffTarget;
  externalUrl?: string;
  externalId?: string;
  error?: string;
}

export class HandOffDispatcher {
  private jiraAdapter: JiraFormatAdapter;
  private linearAdapter: LinearFormatAdapter;
  private githubAdapter: GitHubFormatAdapter;
  private azureDevOpsAdapter: AzureDevOpsFormatAdapter;
  private slackAdapter: SlackFormatAdapter;

  constructor(credentials: IntegrationCredentials = {}) {
    this.jiraAdapter = new JiraFormatAdapter(credentials.jiraUrl, credentials.jiraApiToken, credentials.jiraUserEmail);
    this.linearAdapter = new LinearFormatAdapter(credentials.linearApiKey);
    this.githubAdapter = new GitHubFormatAdapter(credentials.githubToken);
    this.azureDevOpsAdapter = new AzureDevOpsFormatAdapter(credentials.azureDevOpsPat);
    this.slackAdapter = new SlackFormatAdapter(credentials.slackWebhookUrl);
  }

  /**
   * Dispatch an approved action item to a target destination in its native format
   */
  async dispatch(
    destination: HandOffTarget,
    action: HandOffActionItem,
    targetConfig: Record<string, any> = {}
  ): Promise<DispatchResult> {
    logger.info({ destination, actionId: action.id, title: action.title }, `Orchestrating format-aware hand-off to ${destination}`);

    try {
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
          return {
            success: res.success,
            destination: "jira",
            externalUrl: res.url,
            externalId: res.issueKey,
          };
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
          return {
            success: res.success,
            destination: "linear",
            externalUrl: res.url,
            externalId: res.issueIdentifier,
          };
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
          return {
            success: res.success,
            destination: "github",
            externalUrl: res.url,
            externalId: res.issueNumber ? String(res.issueNumber) : undefined,
          };
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
          return {
            success: res.success,
            destination: "azure-devops",
            externalUrl: res.url,
            externalId: res.workItemId ? String(res.workItemId) : undefined,
          };
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
          return {
            success: res.success,
            destination: "slack",
            externalUrl: res.url,
          };
        }

        default:
          throw new Error(`Unsupported hand-off target: ${destination}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Hand-off dispatch failed";
      logger.error({ destination, actionId: action.id, errorMsg }, "Hand-off dispatch error");
      return {
        success: false,
        destination,
        error: errorMsg,
      };
    }
  }
}
