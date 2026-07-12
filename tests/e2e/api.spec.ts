import { describe, it, expect } from "vitest";
import { buildApp } from "../../src/app";
import { makeIdentity } from "../helpers";

const H = { "content-type": "application/json", "x-tenant-id": "demo", "x-workspace-id": "demo", "x-actor-id": "dev-user" };

async function api() {
  const app = buildApp();
  return {
    post: (path: string, body?: unknown) => app.request(path, { method: "POST", headers: H, body: body ? JSON.stringify(body) : undefined }),
    postForm: (path: string, form: FormData) =>
      app.request(path, { method: "POST", headers: { "x-tenant-id": "demo", "x-workspace-id": "demo" }, body: form }),
    get: (path: string) => app.request(path, { method: "GET", headers: H }),
  };
}

describe("e2e: happy path (audio)", () => {
  it("create → upload → transcribe → analyze → approve/reject → audit", async () => {
    const c = await api();
    const cm = await c.post("/api/v1/meetings", { title: "Sprint", meetingType: "CEREMONY", scheduledAt: "2026-07-12T10:00:00Z" });
    const meeting = (await cm.json() as any).data;
    expect(cm.status).toBe(201);

    const form = new FormData();
    form.append("file", new File([new Uint8Array([0xff, 0xfb, 1, 2, 3])], "m.mp3", { type: "audio/mpeg" }));
    const upRes = await c.postForm(`/api/v1/meetings/${meeting.id}/audio`, form);
    expect(upRes.status).toBe(201);

    const tr = await c.post(`/api/v1/meetings/${meeting.id}/transcription`);
    expect(tr.status).toBe(200);

    const an = await c.post(`/api/v1/meetings/${meeting.id}/analysis`);
    expect(an.status).toBe(201);
    const analysis = (await an.json() as any).data;
    expect(analysis.proposedActions.length).toBeGreaterThan(0);

    const a1 = analysis.proposedActions[0];
    const ap = await c.post(`/api/v1/actions/${a1.id}/approve`);
    expect(ap.status).toBe(200);

    const a2 = analysis.proposedActions[1] ?? a1;
    const rj = await c.post(`/api/v1/actions/${a2.id}/reject`, { reason: "not now" });
    expect(rj.status).toBe(200);

    const au = await c.get(`/api/v1/meetings/${meeting.id}/audit`);
    const audit = (await au.json() as any).data;
    const types = audit.map((e: any) => e.eventType);
    expect(types).toContain("MEETING_CREATED");
    expect(types).toContain("ACTION_APPROVED");
    expect(types).toContain("ACTION_REJECTED");
  });

  it("alternate path: paste transcript", async () => {
    const c = await api();
    const cm = await c.post("/api/v1/meetings", { title: "QBR", meetingType: "CEREMONY", scheduledAt: "2026-07-12T10:00:00Z" });
    const meeting = (await cm.json() as any).data;
    const tp = await c.post(`/api/v1/meetings/${meeting.id}/transcript`, { content: "We will launch the beta on the 15th. Priya owns the launch." });
    expect(tp.status).toBe(201);
    const an = await c.post(`/api/v1/meetings/${meeting.id}/analysis`);
    expect(an.status).toBe(201);
  });

  it("failure path: video rejected", async () => {
    const c = await api();
    const cm = await c.post("/api/v1/meetings", { title: "x", meetingType: "CEREMONY", scheduledAt: "2026-07-12T10:00:00Z" });
    const meeting = (await cm.json() as any).data;
    const form = new FormData();
    form.append("file", new File([new Uint8Array([1, 2, 3])], "v.mp4", { type: "video/mp4" }));
    const up = await c.postForm(`/api/v1/meetings/${meeting.id}/audio`, form);
    expect(up.status).toBe(415);
    const body = (await up.json() as any);
    expect(body.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
  });

  it("health endpoints behave independently", async () => {
    const app = buildApp();
    const live = await app.request("/api/health/live");
    const ready = await app.request("/api/health/ready");
    expect((await live.json() as any).live).toBe(true);
    expect((await ready.json() as any).live).toBe(true);
  });
});
