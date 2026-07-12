import { describe, it, expect } from "vitest";
import { buildInMemoryRepos } from "../../src/infrastructure/repositories/in-memory";
import { makeContext, makeIdentity, SAMPLE_MP3 } from "../helpers";
import { CreateMeeting } from "../../src/modules/meetings/application/create-meeting";
import { UploadMeetingAudio } from "../../src/modules/media/application/upload-audio";
import { TranscribeMeetingAudio } from "../../src/modules/transcription/application/transcribe-audio";
import { AnalyzeMeetingTranscript } from "../../src/modules/analysis/application/analyze-transcript";
import { GetMeetingAnalysis } from "../../src/modules/analysis/application/get-analysis";
import { ApproveProposedAction, RejectProposedAction } from "../../src/modules/approvals/application/approve-reject";
import { ListMeetingAuditEvents } from "../../src/modules/audit/application/list-audit";
import { AppError, ErrorCode } from "../../src/shared/errors/AppError";

const H = (tenantId: string, workspaceId: string) => makeIdentity({ tenantId, workspaceId });

async function setupTenant(tenantId: string, workspaceId: string) {
  const ctx = makeContext(H(tenantId, workspaceId));
  const cid = "corr";
  const meeting = await new CreateMeeting(ctx).execute({ title: "M", meetingType: "CEREMONY", scheduledAt: "2026-07-12T10:00:00Z" }, cid);
  await new UploadMeetingAudio(ctx).execute(meeting.id, { file: { bytes: SAMPLE_MP3, fileName: "m.mp3", mimeType: "audio/mpeg" } }, cid);
  await new TranscribeMeetingAudio(ctx).execute(meeting.id, cid);
  const analysis = await new AnalyzeMeetingTranscript(ctx).execute(meeting.id, cid);
  return { ctx, meeting, analysis };
}

describe("repository: tenant/workspace scope enforcement", () => {
  it("cross-tenant meeting-analysis read returns null (BOLA)", async () => {
    const { ctx, meeting, analysis } = await setupTenant("tA", "wA");
    const attacker: any = { ...ctx, identity: H("tB", "wB") };
    // attacker knows the analysis id
    const got = await attacker.repos.meetingAnalysis.getByMeeting("tB", "wB", meeting.id);
    expect(got).toBeNull();
    const byRun = await attacker.repos.meetingAnalysis.getByRun("tB", "wB", analysis.id);
    expect(byRun).toBeNull();
  });

  it("same tenant, wrong workspace returns null", async () => {
    const { ctx, meeting } = await setupTenant("t", "w1");
    const attacker: any = { ...ctx, identity: H("t", "w2") };
    expect(await attacker.repos.meetingAnalysis.getByMeeting("t", "w2", meeting.id)).toBeNull();
  });

  it("wrong tenant, same workspace-like value returns null", async () => {
    const { ctx, meeting } = await setupTenant("tA", "shared");
    const attacker: any = { ...ctx, identity: H("tB", "shared") };
    expect(await attacker.repos.meetingAnalysis.getByMeeting("tB", "shared", meeting.id)).toBeNull();
  });

  it("correct tenant and workspace returns analysis", async () => {
    const { ctx, meeting } = await setupTenant("tA", "wA");
    const got = await ctx.repos.meetingAnalysis.getByMeeting("tA", "wA", meeting.id);
    expect(got).not.toBeNull();
  });

  it("cross-tenant action access returns null", async () => {
    const { ctx, analysis } = await setupTenant("tA", "wA");
    const attacker: any = { ...ctx, identity: H("tB", "wB") };
    const actionId = analysis.proposedActions[0]!.id;
    expect(await attacker.repos.meetingAnalysis.getAction("tB", "wB", actionId)).toBeNull();
  });

  it("cross-workspace action access returns null", async () => {
    const { ctx, analysis } = await setupTenant("t", "w1");
    const attacker: any = { ...ctx, identity: H("t", "w2") };
    const actionId = analysis.proposedActions[0]!.id;
    expect(await attacker.repos.meetingAnalysis.getAction("t", "w2", actionId)).toBeNull();
  });

  it("cross-tenant audit retrieval is blocked with MEETING_NOT_FOUND", async () => {
    const { ctx, meeting } = await setupTenant("tA", "wA");
    const attacker: any = { ...ctx, identity: H("tB", "wB") };
    await expect(new ListMeetingAuditEvents(attacker).execute(meeting.id)).rejects.toThrowError(
      new AppError(ErrorCode.MEETING_NOT_FOUND, "Meeting not found", 404)
    );
  });

  it("valid scoped analysis read via use case succeeds", async () => {
    const { ctx, meeting } = await setupTenant("tA", "wA");
    const a = await new GetMeetingAnalysis(ctx).execute(meeting.id);
    expect(a.meetingId).toBe(meeting.id);
  });

  it("cross-tenant action approval fails with NOT_FOUND", async () => {
    const { ctx, analysis } = await setupTenant("tA", "wA");
    const attacker: any = { ...ctx, identity: H("tB", "wB") };
    const actionId = analysis.proposedActions[0]!.id;
    await expect(new ApproveProposedAction(attacker).execute(actionId, "x")).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND });
  });

  it("random entity identifier yields null without leaking existence", async () => {
    const { ctx } = await setupTenant("tA", "wA");
    expect(await ctx.repos.meetingAnalysis.getByMeeting("tA", "wA", "00000000-0000-0000-0000-000000000000")).toBeNull();
    expect(await ctx.repos.meetingAnalysis.getAction("tA", "wA", "00000000-0000-0000-0000-000000000000")).toBeNull();
  });
});
