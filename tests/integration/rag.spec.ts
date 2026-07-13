import { describe, it, expect } from "vitest";
import { buildApp } from "../../src/app";

describe("Corporate RAG Memory Integration", () => {
  it("queries cross-meeting workspace memory and synthesizes answers", async () => {
    const app = buildApp();
    const headers = {
      "content-type": "application/json",
      "x-tenant-id": "demo",
      "x-workspace-id": "demo",
      "x-actor-id": "dev-user",
    };

    // 1. Create first meeting with "launch" keyword
    const res1 = await app.request("/api/v1/meetings", {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: "Beta Launch Plan",
        meetingType: "CEREMONY",
        scheduledAt: "2026-07-12T10:00:00Z",
      }),
    });
    const meeting1 = (await res1.json() as any).data;

    await app.request(`/api/v1/meetings/${meeting1.id}/transcript`, {
      method: "POST",
      headers,
      body: JSON.stringify({ content: "Let's launch the beta checklist on the 15th." }),
    });

    await app.request(`/api/v1/meetings/${meeting1.id}/analysis`, {
      method: "POST",
      headers,
    });

    // 2. Query RAG with "launch"
    const ragRes = await app.request("/api/v1/rag/query", {
      method: "POST",
      headers,
      body: JSON.stringify({ query: "launch" }),
    });

    expect(ragRes.status).toBe(200);
    const body = await ragRes.json() as any;
    expect(body.data.answer).toBeTruthy();
    expect(body.data.sources.some((s: any) => s.meetingId === meeting1.id)).toBe(true);
  });
});
