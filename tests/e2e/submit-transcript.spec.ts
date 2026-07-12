import { describe, it, expect } from "vitest";
import { buildApp } from "../../src/app";

const H = { "content-type": "application/json", "x-tenant-id": "demo", "x-workspace-id": "demo", "x-actor-id": "dev-user" };

async function api() {
  const app = buildApp();
  return {
    post: (path: string, body?: unknown) => app.request(path, { method: "POST", headers: H, body: body ? JSON.stringify(body) : undefined }),
  };
}

describe("e2e: SubmitMeetingTranscript HTTP/API guard", () => {
  it("returns HTTP 400 and stable typed error for invalid inputs", async () => {
    const c = await api();
    
    // Create a meeting first
    const cm = await c.post("/api/v1/meetings", { title: "Test E2E", meetingType: "CEREMONY", scheduledAt: "2026-07-12T10:00:00Z" });
    const meeting = (await cm.json() as any).data;
    expect(cm.status).toBe(201);

    // 1. Missing request input (empty body)
    const res1 = await c.post(`/api/v1/meetings/${meeting.id}/transcript`);
    expect(res1.status).toBe(400);
    const json1 = await res1.json() as any;
    expect(json1.error.code).toBe("VALIDATION_ERROR");

    // 2. null input
    const res2 = await c.post(`/api/v1/meetings/${meeting.id}/transcript`, null);
    expect(res2.status).toBe(400);
    const json2 = await res2.json() as any;
    expect(json2.error.code).toBe("VALIDATION_ERROR");

    // 3. Missing content
    const res3 = await c.post(`/api/v1/meetings/${meeting.id}/transcript`, { language: "en" });
    expect(res3.status).toBe(400);
    const json3 = await res3.json() as any;
    expect(json3.error.code).toBe("VALIDATION_ERROR");

    // 4. null content
    const res4 = await c.post(`/api/v1/meetings/${meeting.id}/transcript`, { content: null });
    expect(res4.status).toBe(400);
    const json4 = await res4.json() as any;
    expect(json4.error.code).toBe("VALIDATION_ERROR");

    // 5. Non-string content
    const res5 = await c.post(`/api/v1/meetings/${meeting.id}/transcript`, { content: 12345 });
    expect(res5.status).toBe(400);
    const json5 = await res5.json() as any;
    expect(json5.error.code).toBe("VALIDATION_ERROR");

    // 6. Empty string
    const res6 = await c.post(`/api/v1/meetings/${meeting.id}/transcript`, { content: "" });
    expect(res6.status).toBe(400);
    const json6 = await res6.json() as any;
    expect(json6.error.code).toBe("VALIDATION_ERROR");

    // 7. Whitespace only
    const res7 = await c.post(`/api/v1/meetings/${meeting.id}/transcript`, { content: "      " });
    expect(res7.status).toBe(400);
    const json7 = await res7.json() as any;
    expect(json7.error.code).toBe("VALIDATION_ERROR");

    // 8. Valid transcript
    const res8 = await c.post(`/api/v1/meetings/${meeting.id}/transcript`, { content: "This is a valid transcript of sufficient length." });
    expect(res8.status).toBe(201);
    const json8 = await res8.json() as any;
    expect(json8.data.content).toBe("This is a valid transcript of sufficient length.");
  });
});
