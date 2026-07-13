import { logger } from "../../shared/logging/logger";

export class SlackWebhookClient {
  constructor(private readonly webhookUrl?: string) {}

  async sendActionDigest(meetingTitle: string, actionDescription: string, ownerName: string | null, dueDate: string | null): Promise<boolean> {
    const text = `*New Approved Action Item in Conversa*\n` +
      `*Meeting:* ${meetingTitle}\n` +
      `*Action:* ${actionDescription}\n` +
      `*Owner:* ${ownerName || "Unassigned"}\n` +
      `*Due Date:* ${dueDate ? new Date(dueDate).toLocaleDateString() : "No due date"}`;

    return this.send({ text });
  }

  async send(payload: { text: string; [key: string]: any }): Promise<boolean> {
    if (!this.webhookUrl) {
      logger.info({ payload }, "Slack Webhook URL not provided. Logging payload instead.");
      return true;
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        logger.error({ status: response.status }, "Slack Webhook returned error status");
        return false;
      }

      logger.info({}, "Successfully dispatched Slack Webhook notification");
      return true;
    } catch (err) {
      logger.error({ err }, "Slack Webhook request failed");
      return false;
    }
  }
}
