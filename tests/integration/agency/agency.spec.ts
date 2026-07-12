import { describe, it, expect } from "vitest";
import { makeContext, makeIdentity } from "../../helpers";
import { CreateMeeting as CreateMeetingApp } from "../../../src/modules/meetings/application/create-meeting";
import { SubmitMeetingTranscript } from "../../../src/modules/meetings/application/submit-transcript";
import { RunMeetingAgency } from "../../../src/modules/agency/application/run-meeting-agency";
import { AppError } from "../../../src/shared/errors/AppError";

describe("integration: Managed Meeting Agency Crew", () => {
  it("executes the full crew sequence, saving results in-memory", async () => {
    const ctx = makeContext();
    const cid = "corr-agency-1";

    const meeting = await new CreateMeetingApp(ctx).execute({
      title: "Sprint Planning",
      meetingType: "CEREMONY",
      scheduledAt: new Date().toISOString(),
    }, cid);

    await new SubmitMeetingTranscript(ctx).execute(meeting.id, {
      content: "We decided to launch the beta on the 15th. There is a risk that the server might overload. Priya owns the launch and will complete the checklist by 2026-07-15.",
    }, cid);

    const agency = new RunMeetingAgency(ctx);
    const run = await agency.execute(meeting.id, cid, { approvalRequirement: false });

    expect(run.status).toBe("COMPLETED");
    expect(run.totalLatencyMs).toBeGreaterThanOrEqual(0);

    // Verify analysis is saved
    const analysis = await ctx.repos.meetingAnalysis.getByMeeting(ctx.identity.tenantId, ctx.identity.workspaceId, meeting.id);
    expect(analysis).not.toBeNull();
    expect(analysis?.decisions.length).toBe(1);
    expect(analysis?.proposedActions.length).toBe(1);
  });

  it("skips specialists dynamically based on transcript keywords", async () => {
    const ctx = makeContext();
    const cid = "corr-agency-2";

    const meeting = await new CreateMeetingApp(ctx).execute({
      title: "Quick Sync",
      meetingType: "CEREMONY",
      scheduledAt: new Date().toISOString(),
    }, cid);

    await new SubmitMeetingTranscript(ctx).execute(meeting.id, {
      content: "We decided to rename the project to Hermit.",
    }, cid);

    const agency = new RunMeetingAgency(ctx);
    const run = await agency.execute(meeting.id, cid, { approvalRequirement: false });

    // Risk and Action specialists should be marked as skipped
    const steps = await (ctx.repos as any).agencyRun.listSteps(ctx.identity.tenantId, ctx.identity.workspaceId, run.runId);
    expect(steps.some((s: any) => s.agentRole === "RISK_SPECIALIST")).toBe(false);
    expect(steps.some((s: any) => s.agentRole === "ACTION_SPECIALIST")).toBe(false);
  });

  it("gaters manual approval before finalizing outputs", async () => {
    const ctx = makeContext();
    const cid = "corr-agency-3";

    const meeting = await new CreateMeetingApp(ctx).execute({
      title: "Review meeting",
      meetingType: "CEREMONY",
      scheduledAt: new Date().toISOString(),
    }, cid);

    await new SubmitMeetingTranscript(ctx).execute(meeting.id, {
      content: "We decided to launch the beta on the 15th.",
    }, cid);

    const agency = new RunMeetingAgency(ctx);
    const run = await agency.execute(meeting.id, cid, { approvalRequirement: true });

    expect(run.status).toBe("PAUSED");
  });

  it("strictly enforces tenant and workspace isolation boundaries", async () => {
    const ctxA = makeContext(makeIdentity({ tenantId: "tenant-a", workspaceId: "work-a" }));
    const ctxB = makeContext(makeIdentity({ tenantId: "tenant-b", workspaceId: "work-b" }));
    const cid = "corr-agency-4";

    const meetingA = await new CreateMeetingApp(ctxA).execute({
      title: "Confidential Tenant A meeting",
      meetingType: "CEREMONY",
      scheduledAt: new Date().toISOString(),
    }, cid);

    await new SubmitMeetingTranscript(ctxA).execute(meetingA.id, {
      content: "We decided to launch the beta on the 15th.",
    }, cid);

    const agencyA = new RunMeetingAgency(ctxA);
    const runA = await agencyA.execute(meetingA.id, cid, { approvalRequirement: false });

    // Tenant B trying to retrieve Tenant A run details should fail
    const agencyB = new RunMeetingAgency(ctxB);
    await expect(agencyB.execute(meetingA.id, cid)).rejects.toThrow();
  });
});
