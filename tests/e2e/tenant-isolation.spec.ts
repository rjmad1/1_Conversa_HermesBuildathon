import { describe, it, expect } from "vitest";
import { buildApp } from "../../src/app";
import { makeIdentity } from "../helpers";

const sharedApp = buildApp();

function apiAs(tenantId: string, workspaceId: string) {
  const H = {
    "content-type": "application/json",
    "x-tenant-id": tenantId,
    "x-workspace-id": workspaceId,
    "x-actor-id": "dev-user",
  };
  return {
    post: (path: string, body?: unknown) =>
      sharedApp.request(path, { method: "POST", headers: H, body: body ? JSON.stringify(body) : undefined }),
    get: (path: string) => sharedApp.request(path, { method: "GET", headers: H }),
  };
}

async function createMeetingWithAnalysis(tenantId: string, workspaceId: string) {
  const c = apiAs(tenantId, workspaceId);
  const cm = await c.post("/api/v1/meetings", { title: "Sec", meetingType: "CEREMONY", scheduledAt: "2026-07-12T10:00:00Z" });
  const meeting = (await cm.json() as any).data;
  const tp = await c.post(`/api/v1/meetings/${meeting.id}/transcript`, { content: "We will launch the beta on the 15th. Priya owns the launch." });
  const an = await c.post(`/api/v1/meetings/${meeting.id}/analysis`);
  const analysis = (await an.json() as any).data;
  return { meetingId: meeting.id, analysis };
}

describe("e2e: tenant/workspace isolation at API layer", () => {
  it("wrong tenant identity cannot read analysis", async () => {
    const { meetingId } = await createMeetingWithAnalysis("tA", "wA");
    const attacker = apiAs("tB", "wB");
    const res = await attacker.get(`/api/v1/meetings/${meetingId}/analysis`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as any;
    expect(body.error.code).toBe("NOT_FOUND");
    expect(JSON.stringify(body)).not.toContain(meetingId);
  });

  it("wrong workspace identity cannot read analysis", async () => {
    const { meetingId } = await createMeetingWithAnalysis("t", "w1");
    const attacker = apiAs("t", "w2");
    const res = await attacker.get(`/api/v1/meetings/${meetingId}/analysis`);
    expect(res.status).toBe(404);
  });

  it("wrong scope cannot approve another tenant's action", async () => {
    const { analysis } = await createMeetingWithAnalysis("tA", "wA");
    const actionId = analysis.proposedActions[0].id;
    const attacker = apiAs("tB", "wB");
    const res = await attacker.post(`/api/v1/actions/${actionId}/approve`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as any;
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("wrong scope cannot reject another tenant's action", async () => {
    const { analysis } = await createMeetingWithAnalysis("tA", "wA");
    const actionId = analysis.proposedActions[0].id;
    const attacker = apiAs("tB", "wB");
    const res = await attacker.post(`/api/v1/actions/${actionId}/reject`, { reason: "x" });
    expect(res.status).toBe(404);
  });

  it("response does not reveal another tenant's entity details", async () => {
    const { meetingId } = await createMeetingWithAnalysis("tA", "wA");
    const attacker = apiAs("tB", "wB");
    const res = await attacker.get(`/api/v1/meetings/${meetingId}/audit`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as any;
    expect(body.error.code).toBe("MEETING_NOT_FOUND");
  });

  it("valid scoped flow still works", async () => {
    const c = apiAs("tA", "wA");
    const cm = await c.post("/api/v1/meetings", { title: "Sec", meetingType: "CEREMONY", scheduledAt: "2026-07-12T10:00:00Z" });
    const meeting = (await cm.json() as any).data;
    const tp = await c.post(`/api/v1/meetings/${meeting.id}/transcript`, { content: "We will launch the beta on the 15th. Priya owns the launch." });
    expect(tp.status).toBe(201);
    const an = await c.post(`/api/v1/meetings/${meeting.id}/analysis`);
    expect(an.status).toBe(201);
    const analysis = (await an.json() as any).data;
    const ap = await c.post(`/api/v1/actions/${analysis.proposedActions[0].id}/approve`);
    expect(ap.status).toBe(200);
    const au = await c.get(`/api/v1/meetings/${meeting.id}/audit`);
    expect(au.status).toBe(200);
  });
});
