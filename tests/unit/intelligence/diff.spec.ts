import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { RunIntelligenceSweep } from "../../../src/modules/competitive-intelligence/application/run-intelligence-sweep";
import { makeContext } from "../../helpers";

describe("unit: Competitive Intelligence Diffing", () => {
  it("classifies added change when there is no previous snapshot", async () => {
    const ctx = makeContext();
    const competitorId = randomUUID();

    // Configure competitor
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

    expect(run.status).toBe("completed");
    expect(run.diffs.length).toBe(3);
    expect(run.diffs.every(d => d.changeType === "added")).toBe(true);
  });

  it("classifies unchanged when fingerprints match prior snapshot", async () => {
    const ctx = makeContext();
    const competitorId = randomUUID();
    const tenantId = "demo";
    const workspaceId = "demo";

    const competitor = {
      tenantId,
      workspaceId,
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

    // Save baseline snapshot matching Sweep 1 findings
    const snapshot = {
      id: randomUUID(),
      competitorId,
      runId: randomUUID(),
      researchCategory: "pricing" as const,
      sourceUrl: competitor.pricingUrl,
      retrievedAt: new Date().toISOString(),
      normalizedFindings: "Tana Core: Free. Tana Pro: $10/month.",
      contentFingerprint: "fingerprint-pricing-baseline-v1", // matches Sweep 1 baseline fingerprint
      rawSourceExtract: "Tana Pro is priced at $10/month for individuals.",
      tenantId,
      workspaceId,
    };
    await ctx.repos.intelligenceSnapshot.save(snapshot);

    const sweep = new RunIntelligenceSweep(ctx);
    const run = await sweep.execute(competitorId, "corr-2", { useFixture: true });

    // The pricing diff should be "unchanged" since the fingerprint matched the baseline
    const pricingDiff = run.diffs.find(d => d.researchCategory === "pricing");
    expect(pricingDiff?.changeType).toBe("unchanged");
    expect(pricingDiff?.materiality).toBe("informational");
  });

  it("classifies modified with appropriate materiality when fingerprints differ", async () => {
    const ctx = makeContext();
    const competitorId = randomUUID();
    const tenantId = "demo";
    const workspaceId = "demo";

    const competitor = {
      tenantId,
      workspaceId,
      id: competitorId,
      displayName: "Tana",
      pricingUrl: "https://tana.inc/pricing#change", // will trigger modified Sweep 2 findings
      changelogUrl: "https://tana.inc/changelog",
      newsUrl: "https://tana.inc/news",
      searchTerms: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await ctx.repos.competitor.save(competitor);

    // Save baseline snapshot matching Sweep 1 findings
    const snapshot = {
      id: randomUUID(),
      competitorId,
      runId: randomUUID(),
      researchCategory: "pricing" as const,
      sourceUrl: "https://tana.inc/pricing",
      retrievedAt: new Date().toISOString(),
      normalizedFindings: "Tana Core: Free. Tana Pro: $10/month.",
      contentFingerprint: "fingerprint-pricing-baseline-v1", // different from Sweep 2 fingerprint
      rawSourceExtract: "Tana Pro is priced at $10/month for individuals.",
      tenantId,
      workspaceId,
    };
    await ctx.repos.intelligenceSnapshot.save(snapshot);

    const sweep = new RunIntelligenceSweep(ctx);
    const run = await sweep.execute(competitorId, "corr-3", { useFixture: true });

    const pricingDiff = run.diffs.find(d => d.researchCategory === "pricing");
    expect(pricingDiff?.changeType).toBe("modified");
    expect(pricingDiff?.materiality).toBe("high"); // high materiality for price increases
  });
});
