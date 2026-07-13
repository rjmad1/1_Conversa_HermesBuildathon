import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../src/app";
import { ProductAnalyticsTracker } from "../../src/shared/analytics/tracker";

describe("Product Analytics Integration", () => {
  beforeEach(() => {
    ProductAnalyticsTracker.clear();
  });

  it("tracks approvals, rejections, and field overrides via REST endpoints", async () => {
    const app = buildApp();
    const headers = {
      "content-type": "application/json",
      "x-tenant-id": "demo",
      "x-workspace-id": "demo",
      "x-actor-id": "dev-user",
    };

    // 1. Create a meeting
    const createRes = await app.request("/api/v1/meetings", {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: "Analytics Meeting",
        meetingType: "CEREMONY",
        scheduledAt: "2026-07-12T10:00:00Z",
      }),
    });
    const meeting = (await createRes.json() as any).data;

    // 2. Submit transcript
    await app.request(`/api/v1/meetings/${meeting.id}/transcript`, {
      method: "POST",
      headers,
      body: JSON.stringify({ content: "Let's launch the beta checklist. Priya is owner." }),
    });

    // 3. Run analysis
    const analyzeRes = await app.request(`/api/v1/meetings/${meeting.id}/analysis`, {
      method: "POST",
      headers,
    });
    const analysis = (await analyzeRes.json() as any).data;
    expect(analysis.proposedActions).toHaveLength(1);

    const action = analysis.proposedActions[0];

    // 4. PUT override on priority
    const overrideRes = await app.request(`/api/v1/actions/${action.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ priority: "LOW" }),
    });
    expect(overrideRes.status).toBe(200);

    // 5. Approve action
    const approveRes = await app.request(`/api/v1/actions/${action.id}/approve`, {
      method: "POST",
      headers,
    });
    expect(approveRes.status).toBe(200);

    // 6. Verify tracked events
    const events = ProductAnalyticsTracker.listEvents("demo", "demo");
    
    const overrideEvent = events.find((e) => e.eventType === "OVERRIDE");
    const approvalEvent = events.find((e) => e.eventType === "APPROVAL");

    expect(overrideEvent).toBeDefined();
    expect(overrideEvent?.metadata.fieldName).toBe("priority");
    expect(overrideEvent?.metadata.oldValue).toBe("HIGH");
    expect(overrideEvent?.metadata.newValue).toBe("LOW");

    expect(approvalEvent).toBeDefined();
    expect(approvalEvent?.actionId).toBe(action.id);
  });
});
