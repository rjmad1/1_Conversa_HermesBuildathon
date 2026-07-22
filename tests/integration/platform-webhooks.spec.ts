import { describe, it, expect } from "vitest";
import { buildApp } from "../../src/app";

describe("Platform Webhooks & Interactive Approvals Integration Suite", () => {
  const app = buildApp();

  describe("Zoom Webhook Receiver", () => {
    it("handles Zoom URL validation CRC challenge response", async () => {
      const res = await app.request("/api/v1/webhooks/zoom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "endpoint.url_validation",
          payload: { plainToken: "test-zoom-plain-token-123" },
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.plainToken).toBe("test-zoom-plain-token-123");
      expect(data.encryptedToken).toBeDefined();
      expect(typeof data.encryptedToken).toBe("string");
    });

    it("processes Zoom recording completed webhook events", async () => {
      const res = await app.request("/api/v1/webhooks/zoom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "recording.completed",
          payload: {
            object: {
              id: "zoom-meeting-99",
              topic: "Sprint Architecture Planning",
              duration: 45,
              recording_files: [
                {
                  id: "file-1",
                  file_type: "AUDIO_ONLY",
                  download_url: "https://zoom.us/rec/download/123",
                },
              ],
            },
          },
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.handled).toBe(true);
      expect(json.data.meetingId).toBe("zoom-meeting-99");
      expect(json.data.topic).toBe("Sprint Architecture Planning");
    });
  });

  describe("Microsoft Teams Webhook Receiver", () => {
    it("handles Microsoft Teams subscription URL validation challenge", async () => {
      const res = await app.request("/api/v1/webhooks/teams?validationToken=ms-teams-token-abc", {
        method: "POST",
      });

      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toBe("ms-teams-token-abc");
    });

    it("processes Microsoft Teams call recording webhook events", async () => {
      const res = await app.request("/api/v1/webhooks/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: "sub-123",
          changeType: "created",
          resource: "/communications/calls/call-456",
          resourceData: {
            id: "teams-call-456",
            subject: "Product Roadmap Review",
            recordingUrl: "https://graph.microsoft.com/v1.0/me/drive/items/rec123",
          },
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.handled).toBe(true);
      expect(json.data.meetingId).toBe("teams-call-456");
      expect(json.data.topic).toBe("Product Roadmap Review");
    });
  });

  describe("Interactive Slack Block Kit Callbacks", () => {
    it("processes Slack interactive approval button click", async () => {
      const payload = {
        payload: JSON.stringify({
          type: "block_actions",
          actions: [
            {
              action_id: "approve_action_item",
              value: JSON.stringify({ actionId: "action-demo", decision: "approve" }),
            },
          ],
        }),
      };

      const res = await app.request("/api/v1/integrations/slack/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.response_type).toBe("in_channel");
      expect(data.text).toContain("Approved & Dispatched");
    });

    it("processes Slack interactive rejection button click", async () => {
      const payload = {
        payload: JSON.stringify({
          type: "block_actions",
          actions: [
            {
              action_id: "reject_action_item",
              value: JSON.stringify({ actionId: "action-demo", decision: "reject" }),
            },
          ],
        }),
      };

      const res = await app.request("/api/v1/integrations/slack/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.response_type).toBe("in_channel");
      expect(data.text).toContain("Rejected");
    });
  });
});
