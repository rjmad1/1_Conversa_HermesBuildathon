import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SlackWebhookClient } from "../../src/infrastructure/providers/slack";
import { ApproveProposedAction } from "../../src/modules/approvals/application/approve-reject";
import { makeContext } from "../helpers";
import { CreateMeeting } from "../../src/modules/meetings/application/create-meeting";
import { SubmitMeetingTranscript } from "../../src/modules/meetings/application/submit-transcript";
import { AnalyzeMeetingTranscript } from "../../src/modules/analysis/application/analyze-transcript";

describe("Slack Webhook Integration", () => {
  describe("SlackWebhookClient", () => {
    it("logs the payload if no webhook URL is provided", async () => {
      const client = new SlackWebhookClient();
      const success = await client.sendActionDigest("Demo Meeting", "Do Task", "Priya", "2026-07-15T00:00:00.000Z");
      expect(success).toBe(true);
    });

    it("makes API POST request to Slack when webhook URL is provided", async () => {
      const originalFetch = globalThis.fetch;
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
      } as Response);

      globalThis.fetch = mockFetch;

      const client = new SlackWebhookClient("https://hooks.slack.com/services/T00/B00/X00");
      const success = await client.sendActionDigest("Demo Meeting", "Do Task", "Priya", "2026-07-15T00:00:00.000Z");

      expect(success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://hooks.slack.com/services/T00/B00/X00",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: expect.stringContaining("Demo Meeting"),
        })
      );

      globalThis.fetch = originalFetch;
    });
  });

  describe("End-to-End Slack Notification on Approval", () => {
    it("triggers SlackWebhookClient when an action is approved", async () => {
      const originalFetch = globalThis.fetch;
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
      } as Response);
      globalThis.fetch = mockFetch;

      const ctx = makeContext(undefined, {
        SLACK_WEBHOOK_URL: "https://hooks.slack.com/services/test-webhook",
      });

      const cid = "corr-slack-test";
      const meeting = await new CreateMeeting(ctx).execute({
        title: "Slack Test Meeting",
        meetingType: "CEREMONY",
        scheduledAt: "2026-07-12T10:00:00Z",
      }, cid);

      await new SubmitMeetingTranscript(ctx).execute(meeting.id, {
        content: "Let's launch the beta checklist. Priya is owner.",
      }, cid);

      const analysis = await new AnalyzeMeetingTranscript(ctx).execute(meeting.id, cid);
      expect(analysis.proposedActions).toHaveLength(1);

      const actionId = analysis.proposedActions[0]!.id;

      // Approve action
      await new ApproveProposedAction(ctx).execute(actionId, cid);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://hooks.slack.com/services/test-webhook",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("Slack Test Meeting"),
        })
      );

      globalThis.fetch = originalFetch;
    });
  });
});
