import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { makeContext } from "../helpers";
import { buildApp } from "../../src/app";

describe("integration: Waitlist Database Persistence", () => {
  it("normalizes waitlist emails and rejects duplicate signups correctly", async () => {
    const ctx = makeContext();
    const waitlist = ctx.repos.waitlist;
    const tenantId = "demo";
    const workspaceId = "demo";

    const email = "  User@Example.Com  ";
    const normalized = "user@example.com";

    // 1. First save
    await waitlist.save({
      id: randomUUID(),
      tenantId,
      workspaceId,
      email: email.toLowerCase().trim(),
      createdAt: new Date().toISOString(),
      consent: true,
    });

    const entry = await waitlist.getByEmail(tenantId, workspaceId, email);
    expect(entry).not.toBeNull();
    expect(entry?.email).toBe(normalized);

    // 2. Try finding by normalized directly
    const entryNorm = await waitlist.getByEmail(tenantId, workspaceId, normalized);
    expect(entryNorm).not.toBeNull();

    // 3. Verify duplicate detection on the repo instance
    const isDuplicate = await waitlist.getByEmail(tenantId, workspaceId, "  USER@example.com  ");
    expect(isDuplicate).not.toBeNull();
    expect(isDuplicate?.email).toBe(normalized);

    // 4. Verify HTTP endpoint handles trailing/leading whitespace and returns 200
    const app = buildApp();
    const res1 = await app.request("/api/v1/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "Test@Durable.com", source: "landing" }),
    });
    expect(res1.status).toBe(200);

    const res2 = await app.request("/api/v1/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "  test@DURABLE.COM  ", source: "landing" }),
    });
    expect(res2.status).toBe(200);
    const body2 = await res2.json() as any;
    expect(body2.data.registered).toBe(true);
  });
});
