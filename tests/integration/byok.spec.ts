import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildApp } from "../../src/app";
import OpenAI from "openai";

vi.mock("openai", () => {
  const MockOpenAI = vi.fn(function(this: any, config: any) {
    this.apiKey = config?.apiKey;
    this.audio = {
      transcriptions: {
        create: vi.fn().mockResolvedValue({ text: "BYOK transcription content" }),
      },
    };
    this.chat = {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary: "BYOK meeting summary",
                  topics: ["BYOK Topic"],
                  decisions: [],
                  proposedActions: [],
                  risks: [],
                }),
              },
            },
          ],
        }),
      },
    };
  });
  return {
    default: MockOpenAI
  };
});

describe("BYOK Key Management Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts x-openai-api-key and passes it to custom OpenAI providers", async () => {
    const app = buildApp();
    const myKey = "sk-custom-user-key-12345";

    // 1. Create a meeting
    const createRes = await app.request("/api/v1/meetings", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-tenant-id": "demo",
        "x-workspace-id": "demo",
        "x-actor-id": "dev-user",
      },
      body: JSON.stringify({
        title: "BYOK meeting",
        meetingType: "CEREMONY",
        scheduledAt: "2026-07-12T10:00:00Z",
      }),
    });
    const meeting = (await createRes.json() as any).data;

    // 2. Submit transcript (so we can run analysis directly)
    await app.request(`/api/v1/meetings/${meeting.id}/transcript`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-tenant-id": "demo",
        "x-workspace-id": "demo",
        "x-actor-id": "dev-user",
      },
      body: JSON.stringify({ content: "Some transcript details" }),
    });

    // 3. Analyze transcript with client-supplied key in headers
    const analyzeRes = await app.request(`/api/v1/meetings/${meeting.id}/analysis`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-tenant-id": "demo",
        "x-workspace-id": "demo",
        "x-actor-id": "dev-user",
        "x-openai-api-key": myKey,
      },
    });

    expect(analyzeRes.status).toBe(201);
    expect(OpenAI).toHaveBeenCalledWith(expect.objectContaining({ apiKey: myKey }));
  });
});
