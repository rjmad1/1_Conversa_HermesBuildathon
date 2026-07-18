import { describe, it, expect } from "vitest";
import { buildApp } from "../../src/app";

describe("integration: Waitlist Signups", () => {
  it("allows unauthenticated callers to join waitlist with valid email", async () => {
    const app = buildApp();
    const res = await app.request("/api/v1/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "developer@example.com" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.data.registered).toBe(true);
  });

  it("rejects invalid email formats with validation error", async () => {
    const app = buildApp();
    const res = await app.request("/api/v1/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "invalid-email" }),
    });

    expect(res.status).toBe(400);
  });
});
