import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildApp } from "../../src/app";

describe("External Connectors Integration", () => {
  let originalToken: string | undefined;
  let originalJira: string | undefined;
  let originalSf: string | undefined;

  beforeEach(() => {
    originalToken = process.env.GITHUB_TOKEN;
    originalJira = process.env.JIRA_URL;
    originalSf = process.env.SALESFORCE_URL;

    delete process.env.GITHUB_TOKEN;
    delete process.env.JIRA_URL;
    delete process.env.SALESFORCE_URL;
  });

  afterEach(() => {
    if (originalToken) process.env.GITHUB_TOKEN = originalToken;
    if (originalJira) process.env.JIRA_URL = originalJira;
    if (originalSf) process.env.SALESFORCE_URL = originalSf;
  });

  it("exports actions to external destinations (Jira, Salesforce, GitHub) and audits the exports", async () => {
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
        title: "Connector Sync",
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

    // 2. Export to Jira
    const resJira = await app.request(`/api/v1/actions/${actionId}/export`, {
      method: "POST",
      headers,
      body: JSON.stringify({ destination: "jira" }),
    });
    expect(resJira.status).toBe(200);
    const jiraBody = await resJira.json() as any;
    expect(jiraBody.data.success).toBe(true);
    expect(jiraBody.data.url).toContain("jira.example.com");

    // 3. Export to Salesforce
    const resSf = await app.request(`/api/v1/actions/${actionId}/export`, {
      method: "POST",
      headers,
      body: JSON.stringify({ destination: "salesforce" }),
    });
    expect(resSf.status).toBe(200);
    const sfBody = await resSf.json() as any;
    expect(sfBody.data.success).toBe(true);
    expect(sfBody.data.url).toContain("salesforce.example.com");

    // 4. Export to GitHub
    const resGh = await app.request(`/api/v1/actions/${actionId}/export`, {
      method: "POST",
      headers,
      body: JSON.stringify({ destination: "github" }),
    });
    expect(resGh.status).toBe(200);
    const ghBody = await resGh.json() as any;
    expect(ghBody.data.success).toBe(true);
    expect(ghBody.data.url).toContain("github.com");

    // 5. Verify audit events are logged
    const auditRes = await app.request(`/api/v1/meetings/${meeting.id}/audit`, {
      method: "GET",
      headers,
    });
    const auditEvents = (await auditRes.json() as any).data;
    const exportEvents = auditEvents.filter((e: any) => e.eventType === "ACTION_EXPORTED");
    expect(exportEvents).toHaveLength(3);
  });
});
