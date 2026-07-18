import { describe, it, expect } from "vitest";
import { buildApp } from "../../src/app";
import { randomUUID } from "node:crypto";
import { MockSlackAdapter } from "../../src/modules/competitive-intelligence/infrastructure/slack-adapter";

describe("e2e: Competitive Intelligence Lifecyle", () => {
  it("runs the full competitive intelligence lifecycle successfully", async () => {
    const app = buildApp();
    const headers = {
      "Content-Type": "application/json",
      "X-Tenant-Id": "demo",
      "X-Workspace-Id": "demo",
      "X-Actor-Id": "dev-user",
      "X-Actor-Role": "admin",
    };

    // 1. Configure competitor
    const competitorId = randomUUID();
    const configRes = await app.request("/api/v1/intelligence/competitors", {
      method: "POST",
      headers,
      body: JSON.stringify({
        id: competitorId,
        displayName: "Tana",
        pricingUrl: "https://tana.inc/pricing",
        changelogUrl: "https://tana.inc/changelog",
        newsUrl: "https://tana.inc/news",
      }),
    });
    expect(configRes.status).toBe(201);
    const competitor = (await configRes.json() as any).data;
    expect(competitor.displayName).toBe("Tana");

    // 2. Execute baseline sweep
    const sweep1Res = await app.request(`/api/v1/intelligence/competitors/${competitorId}/sweeps`, {
      method: "POST",
      headers,
      body: JSON.stringify({ useFixture: true }),
    });
    expect(sweep1Res.status).toBe(201);
    const run1 = (await sweep1Res.json() as any).data;
    expect(run1.status).toBe("completed");
    expect(run1.diffs.every((d: any) => d.changeType === "added")).toBe(true);

    // 3. Update competitor config (triggering modified pricing in the fixture)
    const updateRes = await app.request("/api/v1/intelligence/competitors", {
      method: "POST",
      headers,
      body: JSON.stringify({
        id: competitorId,
        displayName: "Tana",
        pricingUrl: "https://tana.inc/pricing#change",
        changelogUrl: "https://tana.inc/changelog",
        newsUrl: "https://tana.inc/news",
      }),
    });
    expect(updateRes.status).toBe(201);

    // 4. Execute second sweep (pricing change detected)
    const sweep2Res = await app.request(`/api/v1/intelligence/competitors/${competitorId}/sweeps`, {
      method: "POST",
      headers,
      body: JSON.stringify({ useFixture: true }),
    });
    expect(sweep2Res.status).toBe(201);
    const run2 = (await sweep2Res.json() as any).data;
    expect(run2.status).toBe("completed");

    const pricingDiff = run2.diffs.find((d: any) => d.researchCategory === "pricing");
    expect(pricingDiff.changeType).toBe("modified");
    expect(pricingDiff.materiality).toBe("high");

    // 5. Verify the battlecard reflects latest positioning & implications
    const battlecardRes = await app.request(`/api/v1/intelligence/competitors/${competitorId}/battlecard`, {
      method: "GET",
      headers,
    });
    expect(battlecardRes.status).toBe(200);
    const battlecard = (await battlecardRes.json() as any).data;
    expect(battlecard.lastRunStatus).toBe("completed");
    expect(battlecard.positioning).toContain("recent pricing and product changes");
    expect(battlecard.latestPricingFindings).toContain("Tana Pro: $15/month");
  });
});
