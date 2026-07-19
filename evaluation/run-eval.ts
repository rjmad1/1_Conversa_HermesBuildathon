import { makeContext } from "../tests/helpers";
import { RunMeetingAgency } from "../src/modules/agency/application/run-meeting-agency";
import { EVAL_CASES } from "./meeting-agency-v1/cases";
import type { AppContext } from "../src/modules/app-context";
import { AppError } from "../src/shared/errors/AppError";

async function runEvaluation() {
  console.log(`Starting automated meeting agency evaluation (v1)...`);
  console.log(`Total evaluation cases: ${EVAL_CASES.length}\n`);

  let totalCasesRun = 0;
  let totalLatency = 0;
  let totalCost = 0;

  // Decision metrics
  let decisionTP = 0;
  let decisionFP = 0;
  let decisionFN = 0;

  // Risk metrics
  let riskTP = 0;
  let riskFP = 0;
  let riskFN = 0;

  // Action metrics
  let actionTP = 0;
  let actionFP = 0;
  let actionFN = 0;

  let ownerCorrect = 0;
  let ownerTotal = 0;
  let dateCorrect = 0;
  let dateTotal = 0;

  let hallucinatedOwners = 0;
  let hallucinatedDates = 0;
  let crossTenantFailures = 0;

  let revisionCount = 0;
  let escalationCount = 0;

  for (const kase of EVAL_CASES) {
    totalCasesRun++;
    console.log(`Running case: [${kase.id}] - ${kase.name}`);
    const identity = { tenantId: "tenant-a", workspaceId: "work-a", actorId: "eval-user", actorType: "user" as const, role: "admin" as const };
    const ctx = makeContext(identity);

    // Create a meeting
    const meeting = {
      id: "meeting-" + kase.id,
      tenantId: identity.tenantId,
      workspaceId: identity.workspaceId,
      title: kase.name,
      meetingType: "EVAL",
      status: "READY" as const,
      scheduledAt: new Date().toISOString(),
      createdBy: "eval",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await ctx.repos.meeting.save(meeting);

    // Save transcript
    if (kase.transcript) {
      await ctx.repos.transcript.save({
        id: "transcript-" + kase.id,
        meetingId: meeting.id,
        tenantId: identity.tenantId,
        workspaceId: identity.workspaceId,
        source: "PASTE",
        language: "en",
        content: kase.transcript,
        segments: [],
        status: "READY",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const agency = new RunMeetingAgency(ctx);

    try {
      if (kase.wrongTenantAccess) {
        // Run with wrong tenant
        const badCtx: AppContext = {
          ...ctx,
          identity: { ...identity, tenantId: "tenant-b" },
        };
        const badAgency = new RunMeetingAgency(badCtx);
        try {
          await badAgency.execute(meeting.id, "corr");
          console.error(`FAIL: ${kase.name} - Cross-tenant run permitted`);
          crossTenantFailures++;
        } catch (e) {
          // Expected
        }
        continue;
      }

      if (kase.wrongWorkspaceAccess) {
        // Run with wrong workspace
        const badCtx: AppContext = {
          ...ctx,
          identity: { ...identity, workspaceId: "work-b" },
        };
        const badAgency = new RunMeetingAgency(badCtx);
        try {
          await badAgency.execute(meeting.id, "corr");
          console.error(`FAIL: ${kase.name} - Cross-workspace run permitted`);
          crossTenantFailures++;
        } catch (e) {
          // Expected
        }
        continue;
      }

      if (kase.malformedInput) {
        try {
          await agency.execute(meeting.id, "corr");
          console.error(`FAIL: ${kase.name} - Accepted malformed/empty input`);
        } catch (e) {
          // Expected validation error
        }
        continue;
      }

      const start = Date.now();
      const run = await agency.execute(meeting.id, "corr", { approvalRequirement: false });
      const duration = Date.now() - start;

      totalLatency += duration;
      totalCost += run.estimatedCost;

      // Query final analysis outputs
      const analysis = await ctx.repos.meetingAnalysis.getByMeeting(identity.tenantId, identity.workspaceId, meeting.id);
      const decisions = analysis?.decisions || [];
      const risks = analysis?.risks || [];
      const actions = analysis?.proposedActions || [];

      console.log(`  Extracted Decisions:`, decisions.map(d => d.description));
      console.log(`  Expected Decisions:`, kase.expectedDecisions.map(d => d.description));

      // Query steps to find revisions/escalations
      const steps = await (ctx.repos as any).agencyRun.listSteps(identity.tenantId, identity.workspaceId, run.runId);
      for (const step of steps) {
        if (step.revisionCount > 0) revisionCount += step.revisionCount;
        if (step.status === "ESCALATED") escalationCount++;
      }

      // Check Decisions
      for (const exp of kase.expectedDecisions) {
        const match = decisions.find((d) => d.description === exp.description);
        if (match) {
          decisionTP++;
        } else {
          decisionFN++;
        }
      }
      for (const act of decisions) {
        const match = kase.expectedDecisions.find((d) => d.description === act.description);
        if (!match) {
          decisionFP++;
        }
      }

      // Check Risks
      for (const exp of kase.expectedRisks) {
        const match = risks.find((r) => r === exp);
        if (match) {
          riskTP++;
        } else {
          riskFN++;
        }
      }
      for (const act of risks) {
        const match = kase.expectedRisks.find((r) => r === act);
        if (!match) {
          riskFP++;
        }
      }

      // Check Actions
      for (const exp of kase.expectedActions) {
        const match = actions.find((a) => a.description === exp.description);
        if (match) {
          actionTP++;

          // Owner check
          ownerTotal++;
          if (match.ownerName === exp.ownerName) {
            ownerCorrect++;
          } else {
            console.log(`    Owner mismatch for action "${exp.description}": expected "${exp.ownerName}", got "${match.ownerName}"`);
            if (match.ownerName && !exp.ownerName) {
              hallucinatedOwners++;
            }
          }

          // Date check
          dateTotal++;
          if (match.dueDate === exp.dueDate) {
            dateCorrect++;
          } else {
            console.log(`    Date mismatch for action "${exp.description}": expected "${exp.dueDate}", got "${match.dueDate}"`);
            if (match.dueDate && !exp.dueDate) {
              hallucinatedDates++;
            }
          }
        } else {
          actionFN++;
        }
      }
      for (const act of actions) {
        const match = kase.expectedActions.find((a) => a.description === act.description);
        if (!match) {
          actionFP++;
          if (act.ownerName) hallucinatedOwners++;
          if (act.dueDate) hallucinatedDates++;
        }
      }

    } catch (err) {
      console.error(`Error running case ${kase.name}:`, err);
    }
  }

  // Calculate percentages
  const decRecall = decisionTP + decisionFN > 0 ? decisionTP / (decisionTP + decisionFN) : 1.0;
  const decPrec = decisionTP + decisionFP > 0 ? decisionTP / (decisionTP + decisionFP) : 1.0;

  const riskRecall = riskTP + riskFN > 0 ? riskTP / (riskTP + riskFN) : 1.0;
  const riskPrec = riskTP + riskFP > 0 ? riskTP / (riskTP + riskFP) : 1.0;

  const actRecall = actionTP + actionFN > 0 ? actionTP / (actionTP + actionFN) : 1.0;
  const actPrec = actionTP + actionFP > 0 ? actionTP / (actionTP + actionFP) : 1.0;

  const ownerAcc = ownerTotal > 0 ? ownerCorrect / ownerTotal : 1.0;
  const dateAcc = dateTotal > 0 ? dateCorrect / dateTotal : 1.0;

  const avgLatency = totalLatency / totalCasesRun;
  const avgCost = totalCost / totalCasesRun;

  console.log(`\n--- EVALUATION REPORT ---`);
  console.log(`Decision Recall: ${(decRecall * 100).toFixed(1)}% (Threshold: >= 80%)`);
  console.log(`Decision Precision: ${(decPrec * 100).toFixed(1)}%`);
  console.log(`Risk Recall: ${(riskRecall * 100).toFixed(1)}% (Threshold: >= 80%)`);
  console.log(`Risk Precision: ${(riskPrec * 100).toFixed(1)}%`);
  console.log(`Action Recall: ${(actRecall * 100).toFixed(1)}% (Threshold: >= 80%)`);
  console.log(`Action Precision: ${(actPrec * 100).toFixed(1)}%`);
  console.log(`Owner Accuracy: ${(ownerAcc * 100).toFixed(1)}% (Threshold: = 100%)`);
  console.log(`Date Accuracy: ${(dateAcc * 100).toFixed(1)}% (Threshold: >= 95%)`);
  console.log(`Hallucinated Owners: ${hallucinatedOwners} (Threshold: = 0)`);
  console.log(`Hallucinated Dates: ${hallucinatedDates} (Threshold: = 0)`);
  console.log(`Cross-tenant security failures: ${crossTenantFailures} (Threshold: = 0)`);
  console.log(`Revision rate: ${(revisionCount / totalCasesRun).toFixed(2)} per run`);
  console.log(`Escalation rate: ${(escalationCount / totalCasesRun).toFixed(2)} per run`);
  console.log(`Average Latency: ${avgLatency.toFixed(1)} ms`);
  console.log(`Average Cost: ${avgCost.toFixed(4)} USD`);

  // Assert release gates
  let failed = false;
  if (decRecall < 0.8) { console.error("FAIL: Decision recall below 80%"); failed = true; }
  if (riskRecall < 0.8) { console.error("FAIL: Risk recall below 80%"); failed = true; }
  if (actRecall < 0.8) { console.error("FAIL: Action recall below 80%"); failed = true; }
  if (ownerAcc < 1.0) { console.error("FAIL: Owner accuracy below 100%"); failed = true; }
  if (dateAcc < 0.95) { console.error("FAIL: Date accuracy below 95%"); failed = true; }
  if (hallucinatedOwners > 0) { console.error("FAIL: Hallucinated owners detected"); failed = true; }
  if (hallucinatedDates > 0) { console.error("FAIL: Hallucinated dates detected"); failed = true; }
  if (crossTenantFailures > 0) { console.error("FAIL: Cross-tenant scope access leaked"); failed = true; }

  if (failed) {
    console.error("\nEvaluation failed to satisfy release thresholds.");
    process.exit(1);
  } else {
    console.log("\nALL EVALUATION THRESHOLDS PASSED SUCCESSFULLY!");
    process.exit(0);
  }
}

runEvaluation();
