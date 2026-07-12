import { describe, it, expect } from "vitest";
import { buildApp } from "../../../src/app";

const H = {
  "content-type": "application/json",
  "x-tenant-id": "demo",
  "x-workspace-id": "demo",
  "x-actor-id": "dev-user",
};

const H_FOREIGN = {
  "content-type": "application/json",
  "x-tenant-id": "foreign-tenant",
  "x-workspace-id": "foreign-workspace",
  "x-actor-id": "dev-user",
};

async function api(headers = H) {
  const app = buildApp();
  return {
    post: (path: string, body?: unknown) =>
      app.request(path, { method: "POST", headers, body: body ? JSON.stringify(body) : undefined }),
    get: (path: string) => app.request(path, { method: "GET", headers }),
  };
}

describe("e2e: Managed AI Agency Endpoints", () => {
  it("happy path: create meeting → paste transcript → run agency → review trace → approve final output", async () => {
    const c = await api();
    
    // 1. Create meeting
    const cm = await c.post("/api/v1/meetings", {
      title: "Sprint Review",
      meetingType: "CEREMONY",
      scheduledAt: "2026-07-12T10:00:00Z",
    });
    expect(cm.status).toBe(201);
    const meeting = (await cm.json() as any).data;

    // 2. Paste transcript
    const ct = await c.post(`/api/v1/meetings/${meeting.id}/transcript`, {
      content: "We decided to launch the beta on the 15th. Priya will run the checklist by Friday.",
    });
    expect(ct.status).toBe(201);

    // 3. Run agency analysis
    const cr = await c.post(`/api/v1/meetings/${meeting.id}/agency/run`, {
      approvalRequirement: true,
    });
    expect(cr.status).toBe(201);
    const run = (await cr.json() as any).data;
    expect(run.status).toBe("PAUSED");

    // 4. List runs
    const cl = await c.get("/api/v1/agency/runs");
    expect(cl.status).toBe(200);
    const runsList = (await cl.json() as any).data;
    expect(runsList.length).toBeGreaterThan(0);

    // 5. Retrieve trace details
    const cd = await c.get(`/api/v1/agency/runs/${run.runId}`);
    expect(cd.status).toBe(200);
    const runDetails = (await cd.json() as any).data;
    expect(runDetails.run.runId).toBe(run.runId);
    expect(runDetails.steps.length).toBeGreaterThan(0);

    // 6. Approve final output
    const ca = await c.post(`/api/v1/agency/runs/${run.runId}/approve`);
    expect(ca.status).toBe(200);

    // 7. Verify status updated to COMPLETED / APPROVED
    const cdAfter = await c.get(`/api/v1/agency/runs/${run.runId}`);
    const detailsAfter = (await cdAfter.json() as any).data;
    expect(detailsAfter.run.status).toBe("COMPLETED");
    expect(detailsAfter.run.finalOutcome).toBe("APPROVED");
  });

  it("denies access to foreign tenant agency traces with a non-disclosing 404", async () => {
    const c = await api();
    const f = await api(H_FOREIGN);

    // Create meeting & run agency as tenant 'demo'
    const cm = await c.post("/api/v1/meetings", {
      title: "Confidential demo meeting",
      meetingType: "CEREMONY",
      scheduledAt: "2026-07-12T10:00:00Z",
    });
    const meeting = (await cm.json() as any).data;
    await c.post(`/api/v1/meetings/${meeting.id}/transcript`, { content: "We decided to launch the beta on the 15th." });
    const cr = await c.post(`/api/v1/meetings/${meeting.id}/agency/run`, { approvalRequirement: false });
    const run = (await cr.json() as any).data;

    // Foreign tenant attempts to read run details
    const cf = await f.get(`/api/v1/agency/runs/${run.runId}`);
    expect(cf.status).toBe(404);
  });
});
