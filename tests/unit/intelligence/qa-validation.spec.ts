import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { RunIntelligenceSweep } from "../../../src/modules/competitive-intelligence/application/run-intelligence-sweep";
import { makeContext } from "../../helpers";

describe("unit: QA Claim Validation", () => {
  it("successfully validates and approves correct and grounded analyst output", async () => {
    const ctx = makeContext();
    const competitorId = randomUUID();

    const competitor = {
      tenantId: "demo",
      workspaceId: "demo",
      id: competitorId,
      displayName: "Tana",
      pricingUrl: "https://tana.inc/pricing",
      changelogUrl: "https://tana.inc/changelog",
      newsUrl: "https://tana.inc/news",
      searchTerms: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await ctx.repos.competitor.save(competitor);

    const sweep = new RunIntelligenceSweep(ctx);
    const run = await sweep.execute(competitorId, "corr-1", { useFixture: true });

    expect(run.qaChecks?.passed).toBe(true);
    expect(run.qaChecks?.claimsSourced).toBe(true);
    expect(run.qaChecks?.noCrossTenantData).toBe(true);
    expect(run.qaChecks?.correctCompetitor).toBe(true);
  });

  it("QA rejects attribution errors (referencing other competitors) and triggers revision", async () => {
    const ctx = makeContext();
    const competitorId = randomUUID();

    const competitor = {
      tenantId: "demo",
      workspaceId: "demo",
      id: competitorId,
      displayName: "Tana",
      pricingUrl: "https://tana.inc/pricing#change", // triggers change to calendar (simulating QA trigger)
      changelogUrl: "https://tana.inc/changelog#change",
      newsUrl: "https://tana.inc/news",
      searchTerms: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await ctx.repos.competitor.save(competitor);

    // Save baseline snapshot matching Sweep 1 findings so a change is detected
    const snapshot = {
      id: randomUUID(),
      competitorId,
      runId: randomUUID(),
      researchCategory: "changelog" as const,
      sourceUrl: competitor.changelogUrl,
      retrievedAt: new Date().toISOString(),
      normalizedFindings: "Released Tana AI, Tana commands.",
      contentFingerprint: "fingerprint-changelog-baseline-v1",
      rawSourceExtract: "Version 1.3: Released Tana AI, Tana commands.",
      tenantId: "demo",
      workspaceId: "demo",
    };
    await ctx.repos.intelligenceSnapshot.save(snapshot);

    const sweep = new RunIntelligenceSweep(ctx);
    const run = await sweep.execute(competitorId, "corr-2", { useFixture: true });

    // The first attempt failed QA check (we simulated Notion pricing text in synthesis on attempt 1),
    // and succeeded on attempt 2 (recorded in revision history).
    expect(run.revisionHistory.length).toBe(1);
    expect(run.revisionHistory[0]!.qaChecks.passed).toBe(false);
    expect(run.revisionHistory[0]!.qaChecks.correctCompetitor).toBe(false); // notion attribution failed

    // Final output is corrected
    expect(run.qaChecks?.passed).toBe(true);
    expect(run.analystOutput?.whatChanged).toContain("Tana");
  });
});
