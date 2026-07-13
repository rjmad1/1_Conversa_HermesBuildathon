import { describe, it, expect } from "vitest";
import { buildApp } from "../../src/app";

describe("WebSocket Streaming Endpoint Integration", () => {
  it("exposes the real-time audio stream upgrade endpoint", async () => {
    const app = buildApp();
    const headers = {
      "x-tenant-id": "demo",
      "x-workspace-id": "demo",
      "x-actor-id": "dev-user",
      "Connection": "Upgrade",
      "Upgrade": "websocket",
    };

    const res = await app.request("/api/v1/meetings/00000000-0000-0000-0000-000000000000/stream", {
      method: "GET",
      headers,
    });

    // When the WebSocket headers are present, Hono should either upgrade (101) 
    // or return a bad request (400) if websocket is mock/not supported, but NOT 404.
    expect(res.status).not.toBe(404);
  });
});
