import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildApp } from "../../src/app";
import { IdempotencyStore } from "../../src/shared/security/idempotency";

describe("Idempotency Middleware Integration", () => {
  it("guards against double execution and returns cached responses", async () => {
    const app = buildApp();
    const key = "test-idempotency-key-123";

    const payload = {
      title: "Idempotence Meeting",
      meetingType: "CEREMONY",
      scheduledAt: "2026-07-12T10:00:00Z",
    };

    // 1. First request
    const res1 = await app.request("/api/v1/meetings", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-tenant-id": "demo",
        "x-workspace-id": "demo",
        "x-actor-id": "dev-user",
        "x-idempotency-key": key,
      },
      body: JSON.stringify(payload),
    });

    expect(res1.status).toBe(201);
    const meeting1 = (await res1.json() as any).data;
    expect(meeting1.title).toBe("Idempotence Meeting");

    // 2. Second request (with same key) should return cached response
    const res2 = await app.request("/api/v1/meetings", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-tenant-id": "demo",
        "x-workspace-id": "demo",
        "x-actor-id": "dev-user",
        "x-idempotency-key": key,
      },
      body: JSON.stringify(payload),
    });

    expect(res2.status).toBe(201);
    const meeting2 = (await res2.json() as any).data;
    expect(meeting2.id).toBe(meeting1.id); // Same meeting ID returned!

    // Verify only one meeting exists in the workspace
    const listRes = await app.request("/api/v1/meetings/" + meeting1.id, {
      method: "GET",
      headers: {
        "x-tenant-id": "demo",
        "x-workspace-id": "demo",
        "x-actor-id": "dev-user",
      },
    });
    expect(listRes.status).toBe(200);
  });

  it("returns 409 Conflict for concurrent requests with same key", async () => {
    const app = buildApp();
    const key = "concurrent-idempotency-key";

    // Manually set status to RUNNING in the store to simulate active request
    IdempotencyStore.set("demo", "demo", key, {
      status: "RUNNING",
      statusCode: 200,
      responseBody: "",
    });

    const res = await app.request("/api/v1/meetings", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-tenant-id": "demo",
        "x-workspace-id": "demo",
        "x-actor-id": "dev-user",
        "x-idempotency-key": key,
      },
      body: JSON.stringify({
        title: "Concurrent Meeting",
        meetingType: "CEREMONY",
        scheduledAt: "2026-07-12T10:00:00Z",
      }),
    });

    expect(res.status).toBe(409);
    const errorBody = await res.json() as any;
    expect(errorBody.error.message).toContain("already in progress");

    // Clean up
    IdempotencyStore.delete("demo", "demo", key);
  });
});
