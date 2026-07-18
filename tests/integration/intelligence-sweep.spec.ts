import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { RunIntelligenceSweep } from "../../src/modules/competitive-intelligence/application/run-intelligence-sweep";
import { ConfigureCompetitor } from "../../src/modules/competitive-intelligence/application/configure-competitor";
import { GetBattlecard } from "../../src/modules/competitive-intelligence/application/get-battlecard";
import { makeContext, makeIdentity } from "../helpers";
import { AppError } from "../../src/shared/errors/AppError";

describe("integration: Competitive Intelligence Sweep", () => {
  it("executes baseline and subsequent sweeps, detects changes, and updates battlecard", async () => {
    const ctx = makeContext();
    const correlationId = "corr-sweep-1";

    const configure = new ConfigureCompetitor(ctx);
    const competitor = await configure.execute({
      displayName: "Tana",
      pricingUrl: "https://tana.inc/pricing",
      changelogUrl: "https://tana.inc/changelog",
      newsUrl: "https://tana.inc/news",
    });

    expect(competitor.id).toBeDefined();

    const sweep = new RunIntelligenceSweep(ctx);

    // 1. First sweep (baseline snapshot)
    const run1 = await sweep.execute(competitor.id, correlationId, { useFixture: true });
    expect(run1.status).toBe("completed");
    expect(run1.diffs.every(d => d.changeType === "added")).toBe(true);

    const getBattlecard = new GetBattlecard(ctx);
    const battlecard1 = await getBattlecard.execute(competitor.id);
    expect(battlecard1.lastRunStatus).toBe("completed");
    expect(battlecard1.latestPricingFindings).toContain("Tana Core: Free. Tana Pro: $10/month.");

    // 2. Second sweep with no changes -> should produce unchanged diffs
    const run2 = await sweep.execute(competitor.id, "corr-sweep-2", { useFixture: true });
    expect(run2.status).toBe("completed");
    expect(run2.diffs.every(d => d.changeType === "unchanged")).toBe(true);

    // 3. Third sweep (pricing URL changed -> modified diff)
    // Temporarily configure competitor with "#change" URL
    const competitorChanged = await configure.execute({
      id: competitor.id,
      displayName: "Tana",
      pricingUrl: "https://tana.inc/pricing#change",
      changelogUrl: "https://tana.inc/changelog",
      newsUrl: "https://tana.inc/news",
    });

    const run3 = await sweep.execute(competitorChanged.id, "corr-sweep-3", { useFixture: true });
    expect(run3.status).toBe("completed");
    
    const pricingDiff = run3.diffs.find(d => d.researchCategory === "pricing");
    expect(pricingDiff?.changeType).toBe("modified");
    expect(pricingDiff?.materiality).toBe("high");

    const battlecard2 = await getBattlecard.execute(competitor.id);
    expect(battlecard2.latestPricingFindings).toContain("Tana Core: Free. Tana Pro: $15/month.");
  });

  it("enforces concurrent run locking", async () => {
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

    // Create a run currently in progress
    await ctx.repos.intelligenceRun.save({
      tenantId: "demo",
      workspaceId: "demo",
      runId: randomUUID(),
      competitorId,
      triggerType: "manual",
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: "researching",
      findings: [],
      sourceUrls: [],
      previousSnapshotIds: {},
      diffs: [],
      analystOutput: null,
      qaChecks: null,
      revisionHistory: [],
      slackDeliveryResult: null,
      correlationId: "corr-lock",
    });

    const sweep = new RunIntelligenceSweep(ctx);
    await expect(sweep.execute(competitorId, "corr-lock-2", { useFixture: true }))
      .rejects.toThrow("Accidental concurrent run blocked");
  });

  it("enforces tenant boundary protections", async () => {
    const tenantA = makeIdentity({ tenantId: "tenant-a", workspaceId: "work-a" });
    const tenantB = makeIdentity({ tenantId: "tenant-b", workspaceId: "work-b" });

    const ctxA = makeContext(tenantA);
    const ctxB = makeContext(tenantB);

    const competitorId = randomUUID();

    // Create competitor in Tenant A
    const competitorA = {
      tenantId: tenantA.tenantId,
      workspaceId: tenantA.workspaceId,
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
    await ctxA.repos.competitor.save(competitorA);

    // Tenant B attempts to run sweep on Tenant A's competitor -> should fail
    const sweepB = new RunIntelligenceSweep(ctxB);
    await expect(sweepB.execute(competitorId, "corr-tenant", { useFixture: true }))
      .rejects.toThrow("Competitor not found in this scope");

    // Tenant B attempts to access Tenant A's battlecard -> should fail
    const getBattlecardB = new GetBattlecard(ctxB);
    await expect(getBattlecardB.execute(competitorId))
      .rejects.toThrow("Competitor not found");
  });
});
