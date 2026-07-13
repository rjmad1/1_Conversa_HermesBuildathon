import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildApp } from "../../src/app";

describe("Expanded Connectors Integration", () => {
  const keysToClean = [
    "GITHUB_API_TOKEN", "JIRA_API_URL", "SALESFORCE_API_URL",
    "LINEAR_API_KEY", "HUBSPOT_API_KEY", "GOOGLE_CALENDAR_CLIENT_ID",
    "OUTLOOK_CLIENT_ID", "CLAUDE_CODE_ENDPOINT", "CURSOR_ENDPOINT",
    "GEMINI_API_KEY", "CODEX_API_KEY", "LOVABLE_API_KEY",
    "MCP_SERVER_URL", "DIRECT_API_WEBHOOK_URL", "SLACK_WEBHOOK_URL"
  ];

  const originalEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of keysToClean) {
      originalEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of keysToClean) {
      if (originalEnv[key] !== undefined) {
        process.env[key] = originalEnv[key];
      }
    }
  });

  it("exports actions to all new destinations successfully under mock mode", async () => {
    const app = buildApp();
    const headers = {
      "content-type": "application/json",
      "x-tenant-id": "demo",
      "x-workspace-id": "demo",
      "x-actor-id": "dev-user",
    };

    // 1. Create a meeting and proposed action
    const createRes = await app.request("/api/v1/meetings", {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: "Expansion Sync",
        meetingType: "CEREMONY",
        scheduledAt: "2026-07-12T10:00:00Z",
      }),
    });
    const meeting = (await createRes.json() as any).data;

    await app.request(`/api/v1/meetings/${meeting.id}/transcript`, {
      method: "POST",
      headers,
      body: JSON.stringify({ content: "Let's launch the beta checklist." }),
    });

    const analyzeRes = await app.request(`/api/v1/meetings/${meeting.id}/analysis`, {
      method: "POST",
      headers,
    });
    const analysis = (await analyzeRes.json() as any).data;
    const actionId = analysis.proposedActions[0].id;

    // 2. Export to all new destinations
    const destinations = [
      "linear",
      "slack",
      "hubspot",
      "google-calendar",
      "outlook",
      "claude-code",
      "cursor",
      "gemini",
      "codex",
      "lovable",
      "mcp",
      "direct-api",
    ];

    for (const destination of destinations) {
      const res = await app.request(`/api/v1/actions/${actionId}/export`, {
        method: "POST",
        headers,
        body: JSON.stringify({ destination }),
      });
      
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data.success).toBe(true);
      expect(body.data.url).toBeDefined();
    }

    // 3. Verify audit events are logged
    const auditRes = await app.request(`/api/v1/meetings/${meeting.id}/audit`, {
      method: "GET",
      headers,
    });
    const auditEvents = (await auditRes.json() as any).data;
    const exportEvents = auditEvents.filter((e: any) => e.eventType === "ACTION_EXPORTED");
    expect(exportEvents).toHaveLength(destinations.length);
  });
});
