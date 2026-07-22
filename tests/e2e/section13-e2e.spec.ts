import { describe, it, expect } from "vitest";
import { buildApp } from "../../src/app";
import { AzureKeyVaultSecurityService } from "../../src/infrastructure/security/key-vault";
import { WorkspaceDecisionRAGEngine } from "../../src/modules/retrieval/vector-search";

describe("e2e: Section 13 Opportunities End-to-End API Certification", () => {
  it("processes destination status webhook callback at HTTP layer (/api/v1/webhooks/destination-sync)", async () => {
    const app = buildApp();
    const H = { "content-type": "application/json", "x-tenant-id": "demo", "x-workspace-id": "demo", "x-actor-id": "dev-user" };

    // First create a meeting and submit transcript to seed an action item
    const createRes = await app.request("/api/v1/meetings", {
      method: "POST",
      headers: H,
      body: JSON.stringify({ title: "Architecture Sync", meetingType: "TEAM_SYNC", scheduledAt: "2026-07-22T10:00:00Z" }),
    });

    expect(createRes.status).toBe(201);
    const meetingData = (await createRes.json() as any).data;

    const transcriptRes = await app.request(`/api/v1/meetings/${meetingData.id}/transcript`, {
      method: "POST",
      headers: H,
      body: JSON.stringify({ content: "Priya will complete the beta launch checklist by 7/15/2026." }),
    });
    expect(transcriptRes.status).toBe(201);

    const analysisRes = await app.request(`/api/v1/meetings/${meetingData.id}/analysis`, {
      method: "POST",
      headers: H,
    });

    expect(analysisRes.status).toBe(201);
    const analysisData = (await analysisRes.json() as any).data;
    const actionId = analysisData.proposedActions[0]?.id;

    const payload = {
      provider: "jira",
      event: "jira:issue_updated",
      issueKeyOrId: "CONV-200",
      actionId: actionId,
      status: "COMPLETED",
    };

    const res = await app.request("/api/v1/webhooks/destination-sync", {
      method: "POST",
      headers: H,
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const json = (await res.json() as any);
    expect(json.data.success).toBe(true);
    expect(json.data.actionId).toBe(actionId);
  });

  it("executes decision RAG search via HTTP API (/api/v1/search/rag)", async () => {
    const app = buildApp();
    const H = { "content-type": "application/json", "x-tenant-id": "demo", "x-workspace-id": "demo", "x-actor-id": "dev-user" };
    const payload = {
      query: "Clerk SSO tenant isolation decision",
      topK: 3,
      filterType: "DECISION",
    };

    const res = await app.request("/api/v1/search/rag", {
      method: "POST",
      headers: H,
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const json = (await res.json() as any);
    expect(json.data.query).toBe("Clerk SSO tenant isolation decision");
    expect(json.data.results.length).toBeGreaterThan(0);
    expect(json.data.contextSummary).toContain("Clerk SSO");
  });

  it("verifies Key Vault encryption envelope integrity end-to-end", () => {
    const keyVault = new AzureKeyVaultSecurityService();
    const creds = {
      integrationId: "int-e2e-1",
      provider: "linear" as const,
      apiKey: "lin_api_key_sec_98765",
      updatedAt: new Date().toISOString(),
    };

    const { payload, vaultRef } = keyVault.secureCredentials(creds as any);
    expect(vaultRef).toBe("akv://linear/int-e2e-1");

    const unsealed = keyVault.unsealCredentials(payload);
    expect(unsealed.integrationId).toBe("int-e2e-1");
    expect((unsealed as any).apiKey).toBe("lin_api_key_sec_98765");
  });

  it("verifies confidence auto-dispatch threshold logic end-to-end", async () => {
    const ragEngine = new WorkspaceDecisionRAGEngine();
    const ragResult = await ragEngine.searchDecisions({
      tenantId: "demo",
      workspaceId: "demo",
      query: "Jira REST v3 and Linear GraphQL payload adapters",
      topK: 1,
    });

    expect(ragResult.totalMatches).toBeGreaterThan(0);
    expect(ragResult.results[0]!.similarityScore).toBeGreaterThanOrEqual(0.65);
  });

  it("executes Autonomous A2A Task Negotiation via HTTP API (/api/v1/agency/a2a/negotiate)", async () => {
    const app = buildApp();
    const H = { "content-type": "application/json", "x-tenant-id": "demo", "x-workspace-id": "demo", "x-actor-id": "dev-user" };
    const res = await app.request("/api/v1/agency/a2a/negotiate", {
      method: "POST",
      headers: H,
      body: JSON.stringify({
        actionId: "act-http-a2a",
        title: "Deploy multi-cloud Kubernetes ingress",
        suggestedAssignee: "DevOpsLead",
        estimatedHours: 6,
        priority: "high",
      }),
    });

    expect(res.status).toBe(200);
    const json = (await res.json() as any);
    expect(json.data.accepted).toBe(true);
    expect(json.data.finalAssignee).toBe("DevOpsLead");
    expect(json.data.confidenceScore).toBeGreaterThanOrEqual(0.95);
  });

  it("schedules Zero-Touch Ambient Bot via HTTP API (/api/v1/meetings/ambient/schedule)", async () => {
    const app = buildApp();
    const H = { "content-type": "application/json", "x-tenant-id": "demo", "x-workspace-id": "demo", "x-actor-id": "dev-user" };
    const res = await app.request("/api/v1/meetings/ambient/schedule", {
      method: "POST",
      headers: H,
      body: JSON.stringify({
        eventId: "evt-http-ambient-1",
        platform: "google_meet",
        meetingUrl: "https://meet.google.com/abc-defg-hij",
        title: "Product Architecture Alignment",
        organizerEmail: "arch@conversa.io",
      }),
    });

    expect(res.status).toBe(201);
    const json = (await res.json() as any);
    expect(json.data.botId).toContain("google_meet");
    expect(json.data.status).toBe("SCHEDULED");
  });

  it("executes Workspace Vector RAG search via HTTP API (/api/v1/search/vector-rag)", async () => {
    const app = buildApp();
    const H = { "content-type": "application/json", "x-tenant-id": "demo", "x-workspace-id": "demo", "x-actor-id": "dev-user" };
    const res = await app.request("/api/v1/search/vector-rag", {
      method: "POST",
      headers: H,
      body: JSON.stringify({
        queryText: "Clerk authentication provider decision",
        topK: 2,
        filterType: "DECISION",
      }),
    });

    expect(res.status).toBe(200);
    const json = (await res.json() as any);
    expect(json.data.results.length).toBeGreaterThan(0);
    expect(json.data.results[0].title).toContain("Clerk");
  });

  it("encrypts sensitive credentials via HTTP API (/api/v1/security/credentials/encrypt)", async () => {
    const app = buildApp();
    const H = { "content-type": "application/json", "x-tenant-id": "demo", "x-workspace-id": "demo", "x-actor-id": "dev-user" };
    const res = await app.request("/api/v1/security/credentials/encrypt", {
      method: "POST",
      headers: H,
      body: JSON.stringify({
        plaintext: "sec_token_998877665544332211",
      }),
    });

    expect(res.status).toBe(200);
    const json = (await res.json() as any);
    expect(json.data.ciphertext).toBeDefined();
    expect(json.data.iv).toBeDefined();
    expect(json.data.tag).toBeDefined();
  });
});

