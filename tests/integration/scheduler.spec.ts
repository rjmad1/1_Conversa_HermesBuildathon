import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import worker from "../../src/worker";

describe("Daily Sweeps Scheduler Integration", () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("fires workspace sweeps successfully when scheduler event is triggered", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
    } as Response);
    globalThis.fetch = mockFetch;

    // Set SLACK_WEBHOOK_URL to make sure it tries to notify Slack
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/cron-test";

    // 1. Create a meeting and an unresolved action item using the worker's fetch
    const createRes = await worker.fetch(
      new Request("http://localhost/api/v1/meetings", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": "demo",
          "x-workspace-id": "demo",
          "x-actor-id": "dev-user",
        },
        body: JSON.stringify({
          title: "Weekly Update",
          meetingType: "CEREMONY",
          scheduledAt: "2026-07-12T10:00:00Z",
        }),
      }),
      {}
    );
    const meeting = (await createRes.json() as any).data;

    // Submit transcript that extracts actions
    await worker.fetch(
      new Request(`http://localhost/api/v1/meetings/${meeting.id}/transcript`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": "demo",
          "x-workspace-id": "demo",
          "x-actor-id": "dev-user",
        },
        body: JSON.stringify({ content: "Priya will launch the beta. Rajeev will draft the RFC." }),
      }),
      {}
    );

    // Run analysis to generate proposed actions
    await worker.fetch(
      new Request(`http://localhost/api/v1/meetings/${meeting.id}/analysis`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": "demo",
          "x-workspace-id": "demo",
          "x-actor-id": "dev-user",
        },
      }),
      {}
    );

    // 2. Trigger the scheduled cron sweep on the worker
    await worker.scheduled({}, {}, {});

    // 3. Verify it swept and called the Slack webhook with the unresolved actions digest
    expect(mockFetch).toHaveBeenCalledWith(
      "https://hooks.slack.com/services/cron-test",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("Conversa Daily Unresolved Actions Digest"),
      })
    );

    delete process.env.SLACK_WEBHOOK_URL;
  });
});
