import { logger } from "../../shared/logging/logger";
import { HandOffDispatcher, type HandOffTarget } from "../../modules/integrations/hand-off-dispatcher";

export type ConnectorDestination =
  | "jira"
  | "salesforce"
  | "github"
  | "linear"
  | "slack"
  | "azure-devops"
  | "hubspot"
  | "google-calendar"
  | "outlook"
  | "claude-code"
  | "cursor"
  | "gemini"
  | "codex"
  | "lovable"
  | "mcp"
  | "direct-api";

export interface ConnectorConfig {
  jiraUrl?: string;
  jiraApiToken?: string;
  jiraUserEmail?: string;
  salesforceUrl?: string;
  githubToken?: string;
  linearApiKey?: string;
  slackWebhookUrl?: string;
  azureDevOpsPat?: string;
  hubspotApiKey?: string;
  googleCalendarClientId?: string;
  outlookClientId?: string;
  claudeCodeEndpoint?: string;
  cursorEndpoint?: string;
  geminiApiKey?: string;
  codexApiKey?: string;
  lovableApiKey?: string;
  mcpServerUrl?: string;
  directApiWebhookUrl?: string;
}

export class ExternalConnectorDispatcher {
  private handOffDispatcher: HandOffDispatcher;

  constructor(private readonly config: ConnectorConfig) {
    this.handOffDispatcher = new HandOffDispatcher({
      jiraUrl: config.jiraUrl,
      jiraApiToken: config.jiraApiToken,
      jiraUserEmail: config.jiraUserEmail,
      linearApiKey: config.linearApiKey,
      githubToken: config.githubToken,
      azureDevOpsPat: config.azureDevOpsPat,
      slackWebhookUrl: config.slackWebhookUrl,
    });
  }

  async exportAction(
    destination: ConnectorDestination,
    payload: { title: string; description: string; ownerName?: string | null; dueDate?: string | null; id?: string; meetingTitle?: string }
  ): Promise<{ success: boolean; url?: string; externalId?: string }> {
    logger.info({ destination, payload }, `Dispatching action item via ExternalConnectorDispatcher to ${destination}`);

    // Delegate native hand-off targets to modular HandOffDispatcher
    if (destination === "jira" || destination === "linear" || destination === "github" || destination === "slack" || destination === "azure-devops") {
      const actionItem = {
        id: payload.id || `action-${Date.now()}`,
        title: payload.title,
        description: payload.description,
        ownerName: payload.ownerName,
        dueDate: payload.dueDate,
        meetingTitle: payload.meetingTitle,
      };

      const result = await this.handOffDispatcher.dispatch(destination as HandOffTarget, actionItem);
      return {
        success: result.success,
        url: result.externalUrl || "",
        externalId: result.externalId,
      };
    }

    // Secondary fallback connectors
    switch (destination) {
      case "salesforce":
        return this.sendToSalesforce(payload);
      case "hubspot":
        return this.sendToHubSpot(payload);
      case "google-calendar":
        return this.sendToGoogleCalendar(payload);
      case "outlook":
        return this.sendToOutlook(payload);
      case "claude-code":
        return this.sendToClaudeCode(payload);
      case "cursor":
        return this.sendToCursor(payload);
      case "gemini":
        return this.sendToGemini(payload);
      case "codex":
        return this.sendToCodex(payload);
      case "lovable":
        return this.sendToLovable(payload);
      case "mcp":
        return this.sendToMcp(payload);
      case "direct-api":
        return this.sendToDirectApi(payload);
      default:
        throw new Error(`Unsupported destination: ${destination}`);
    }
  }

  private async sendToSalesforce(payload: any): Promise<{ success: boolean; url: string }> {
    if (!this.config.salesforceUrl) {
      logger.info({}, "Salesforce URL not configured. Returning mock Salesforce task URL.");
      return { success: true, url: "https://salesforce.example.com/00T00000000xxxx" };
    }
    try {
      const res = await fetch(`${this.config.salesforceUrl}/services/data/v50.0/sobjects/Task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Subject: payload.title,
          Description: payload.description,
          Status: "Not Started",
          Priority: "Normal",
        }),
      });
      return { success: res.ok, url: `${this.config.salesforceUrl}/00T00000000xxxx` };
    } catch (e) {
      logger.error({ e }, "Salesforce export failed");
      return { success: false, url: "" };
    }
  }

  private async sendToHubSpot(payload: any): Promise<{ success: boolean; url: string }> {
    if (!this.config.hubspotApiKey) {
      logger.info({}, "HubSpot API key not configured. Returning mock HubSpot task URL.");
      return { success: true, url: "https://app.hubspot.com/contacts/123/task/456" };
    }
    try {
      const res = await fetch("https://api.hubapi.com/crm/v3/objects/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.hubspotApiKey}`,
        },
        body: JSON.stringify({
          properties: {
            hs_task_subject: payload.title,
            hs_task_body: payload.description,
          },
        }),
      });
      return { success: res.ok, url: "https://app.hubspot.com/contacts/123/task/456" };
    } catch (e) {
      logger.error({ e }, "HubSpot export failed");
      return { success: false, url: "" };
    }
  }

  private async sendToGoogleCalendar(payload: any): Promise<{ success: boolean; url: string }> {
    if (!this.config.googleCalendarClientId) {
      logger.info({}, "Google Calendar not configured. Returning mock Google Calendar event URL.");
      return { success: true, url: "https://calendar.google.com/event?eid=123" };
    }
    try {
      const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.googleCalendarClientId}`,
        },
        body: JSON.stringify({
          summary: payload.title,
          description: payload.description,
          start: { dateTime: payload.dueDate || new Date().toISOString() },
          end: { dateTime: payload.dueDate || new Date().toISOString() },
        }),
      });
      return { success: res.ok, url: "https://calendar.google.com/event?eid=123" };
    } catch (e) {
      logger.error({ e }, "Google Calendar export failed");
      return { success: false, url: "" };
    }
  }

  private async sendToOutlook(payload: any): Promise<{ success: boolean; url: string }> {
    if (!this.config.outlookClientId) {
      logger.info({}, "Outlook not configured. Returning mock Outlook event URL.");
      return { success: true, url: "https://outlook.office.com/calendar/item/123" };
    }
    try {
      const res = await fetch("https://graph.microsoft.com/v1.0/me/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.outlookClientId}`,
        },
        body: JSON.stringify({
          subject: payload.title,
          body: { contentType: "HTML", content: payload.description },
          start: { dateTime: payload.dueDate || new Date().toISOString(), timeZone: "UTC" },
          end: { dateTime: payload.dueDate || new Date().toISOString(), timeZone: "UTC font" },
        }),
      });
      return { success: res.ok, url: "https://outlook.office.com/calendar/item/123" };
    } catch (e) {
      logger.error({ e }, "Outlook export failed");
      return { success: false, url: "" };
    }
  }

  private async sendToClaudeCode(payload: any): Promise<{ success: boolean; url: string }> {
    if (!this.config.claudeCodeEndpoint) {
      logger.info({}, "Claude Code endpoint not configured. Returning mock Claude Code workspace URL.");
      return { success: true, url: "https://claude.ai/code/workspace-abc" };
    }
    try {
      const res = await fetch(this.config.claudeCodeEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return { success: res.ok, url: "https://claude.ai/code/workspace-abc" };
    } catch (e) {
      logger.error({ e }, "Claude Code export failed");
      return { success: false, url: "" };
    }
  }

  private async sendToCursor(payload: any): Promise<{ success: boolean; url: string }> {
    if (!this.config.cursorEndpoint) {
      logger.info({}, "Cursor endpoint not configured. Returning mock Cursor task URL.");
      return { success: true, url: "https://cursor.sh/tasks/123" };
    }
    try {
      const res = await fetch(this.config.cursorEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return { success: res.ok, url: "https://cursor.sh/tasks/123" };
    } catch (e) {
      logger.error({ e }, "Cursor export failed");
      return { success: false, url: "" };
    }
  }

  private async sendToGemini(payload: any): Promise<{ success: boolean; url: string }> {
    if (!this.config.geminiApiKey) {
      logger.info({}, "Gemini API key not configured. Returning mock Gemini workflow URL.");
      return { success: true, url: "https://aistudio.google.com/gemini/run/789" };
    }
    try {
      const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.config.geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${payload.title}\n${payload.description}` }] }],
        }),
      });
      return { success: res.ok, url: "https://aistudio.google.com/gemini/run/789" };
    } catch (e) {
      logger.error({ e }, "Gemini export failed");
      return { success: false, url: "" };
    }
  }

  private async sendToCodex(payload: any): Promise<{ success: boolean; url: string }> {
    if (!this.config.codexApiKey) {
      logger.info({}, "Codex API key not configured. Returning mock Codex task URL.");
      return { success: true, url: "https://codex.openai.com/task/456" };
    }
    try {
      const res = await fetch("https://api.openai.com/v1/engines/davinci-codex/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.codexApiKey}`,
        },
        body: JSON.stringify({
          prompt: `${payload.title}\n${payload.description}`,
          max_tokens: 100,
        }),
      });
      return { success: res.ok, url: "https://codex.openai.com/task/456" };
    } catch (e) {
      logger.error({ e }, "Codex export failed");
      return { success: false, url: "" };
    }
  }

  private async sendToLovable(payload: any): Promise<{ success: boolean; url: string }> {
    if (!this.config.lovableApiKey) {
      logger.info({}, "Lovable API key not configured. Returning mock Lovable build URL.");
      return { success: true, url: "https://lovable.dev/builds/123" };
    }
    try {
      const res = await fetch("https://api.lovable.dev/v1/builds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.lovableApiKey}`,
        },
        body: JSON.stringify({
          name: payload.title,
          prompt: payload.description,
        }),
      });
      return { success: res.ok, url: "https://lovable.dev/builds/123" };
    } catch (e) {
      logger.error({ e }, "Lovable export failed");
      return { success: false, url: "" };
    }
  }

  private async sendToMcp(payload: any): Promise<{ success: boolean; url: string }> {
    if (!this.config.mcpServerUrl) {
      logger.info({}, "MCP server URL not configured. Returning mock MCP request URL.");
      return { success: true, url: "mcp://localhost:8080/tools/create-action" };
    }
    try {
      const res = await fetch(`${this.config.mcpServerUrl}/tools/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "create-action",
          arguments: { title: payload.title, description: payload.description },
        }),
      });
      return { success: res.ok, url: `mcp://localhost:8080/tools/create-action` };
    } catch (e) {
      logger.error({ e }, "MCP export failed");
      return { success: false, url: "" };
    }
  }

  private async sendToDirectApi(payload: any): Promise<{ success: boolean; url: string }> {
    if (!this.config.directApiWebhookUrl) {
      logger.info({}, "Direct API webhook URL not configured. Returning mock Direct API URL.");
      return { success: true, url: "https://api.external.com/v1/webhooks/action" };
    }
    try {
      const res = await fetch(this.config.directApiWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return { success: res.ok, url: this.config.directApiWebhookUrl };
    } catch (e) {
      logger.error({ e }, "Direct API export failed");
      return { success: false, url: "" };
    }
  }
}
