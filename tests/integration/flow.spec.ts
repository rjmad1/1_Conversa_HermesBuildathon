import { describe, it, expect } from "vitest";
import { makeContext, makeIdentity, SAMPLE_MP3 } from "../helpers";
import { CreateMeeting } from "../../src/modules/meetings/application/create-meeting";
import { UploadMeetingAudio } from "../../src/modules/media/application/upload-audio";
import { SubmitMeetingTranscript } from "../../src/modules/meetings/application/submit-transcript";
import { TranscribeMeetingAudio } from "../../src/modules/transcription/application/transcribe-audio";
import { AnalyzeMeetingTranscript } from "../../src/modules/analysis/application/analyze-transcript";
import { GetMeetingAnalysis } from "../../src/modules/analysis/application/get-analysis";
import { ApproveProposedAction, RejectProposedAction } from "../../src/modules/approvals/application/approve-reject";
import { ListMeetingAuditEvents } from "../../src/modules/audit/application/list-audit";
import { AppError, ErrorCode } from "../../src/shared/errors/AppError";

async function fullFlow(ctx = makeContext()) {
  const cid = "corr-1";
  const meeting = await new CreateMeeting(ctx).execute({ title: "Sprint", meetingType: "CEREMONY", scheduledAt: "2026-07-12T10:00:00Z" }, cid);
  const asset = await new UploadMeetingAudio(ctx).execute(meeting.id, { file: { bytes: SAMPLE_MP3, fileName: "m.mp3", mimeType: "audio/mpeg" } }, cid);
  expect(asset.status).toBe("STORED");
  const transcript = await new TranscribeMeetingAudio(ctx).execute(meeting.id, cid);
  const analysis = await new AnalyzeMeetingTranscript(ctx).execute(meeting.id, cid);
  return { meeting, asset, transcript, analysis };
}

describe("integration: audio-to-action flow", () => {
  it("creates meeting, audio metadata, fake transcription, fake analysis", async () => {
    const ctx = makeContext();
    const { meeting, asset, transcript, analysis } = await fullFlow(ctx);
    expect(asset.checksum).toBeTruthy();
    expect(transcript.content.length).toBeGreaterThan(0);
    expect(analysis.proposedActions.length).toBeGreaterThan(0);
    const stored = await ctx.repos.audio.get(ctx.identity.tenantId, ctx.identity.workspaceId, asset.id);
    expect(stored).not.toBeNull();
  });

  it("pasted transcript flow works without audio", async () => {
    const ctx = makeContext();
    const cid = "corr-2";
    const meeting = await new CreateMeeting(ctx).execute({ title: "QBR", meetingType: "CEREMONY", scheduledAt: "2026-07-12T10:00:00Z" }, cid);
    const t = await new SubmitMeetingTranscript(ctx).execute(meeting.id, { content: "We will launch the beta on the 15th. Priya owns the launch." }, cid);
    expect(t.source).toBe("PASTE");
    const analysis = await new AnalyzeMeetingTranscript(ctx).execute(meeting.id, cid);
    expect(analysis.summary).toBeTruthy();
  });

  it("analysis retrieval + idempotency", async () => {
    const ctx = makeContext();
    const { meeting } = await fullFlow(ctx);
    const a1 = await new AnalyzeMeetingTranscript(ctx).execute(meeting.id, "c");
    const a2 = await new AnalyzeMeetingTranscript(ctx).execute(meeting.id, "c");
    expect(a1.id).toBe(a2.id);
    const got = await new GetMeetingAnalysis(ctx).execute(meeting.id);
    expect(got.id).toBe(a1.id);
  });

  it("approve and reject with reason", async () => {
    const ctx = makeContext();
    const { meeting } = await fullFlow(ctx);
    const analysis = await new AnalyzeMeetingTranscript(ctx).execute(meeting.id, "c");
    const action = analysis.proposedActions[0]!;
    await new ApproveProposedAction(ctx).execute(action.id, "c");
    const rejected = analysis.proposedActions[1] ?? analysis.proposedActions[0]!;
    await expect(new RejectProposedAction(ctx).execute(rejected.id, "", "c")).rejects.toThrow();
    await new RejectProposedAction(ctx).execute(rejected.id, "not relevant", "c");
    const stored = await ctx.repos.meetingAnalysis.getAction(ctx.identity.tenantId, ctx.identity.workspaceId, rejected.id);
    expect(stored?.status).toBe("REJECTED");
  });

  it("append-only audit events", async () => {
    const ctx = makeContext();
    const { meeting } = await fullFlow(ctx);
    const events = await new ListMeetingAuditEvents(ctx).execute(meeting.id);
    const types = events.map((e) => e.eventType);
    expect(types).toContain("MEETING_CREATED");
    expect(types).toContain("AUDIO_UPLOADED");
    expect(types).toContain("TRANSCRIPT_CREATED");
    expect(types).toContain("ANALYSIS_COMPLETED");
  });

  it("duplicate analysis returns existing run", async () => {
    const ctx = makeContext();
    const { meeting } = await fullFlow(ctx);
    const first = await new AnalyzeMeetingTranscript(ctx).execute(meeting.id, "c");
    const second = await new AnalyzeMeetingTranscript(ctx).execute(meeting.id, "c");
    expect(first.id).toBe(second.id);
  });

  it("invalid state transition rejected", async () => {
    const ctx = makeContext();
    const { meeting } = await fullFlow(ctx);
    const analysis = await new AnalyzeMeetingTranscript(ctx).execute(meeting.id, "c");
    const action = analysis.proposedActions[0]!;
    await new ApproveProposedAction(ctx).execute(action.id, "c");
    await expect(new ApproveProposedAction(ctx).execute(action.id, "c")).rejects.toThrow();
  });

  it("tenant isolation: cross-tenant read returns null", async () => {
    const ctxA = makeContext(makeIdentity({ tenantId: "tA", workspaceId: "wA" }));
    const ctxB = makeContext(makeIdentity({ tenantId: "tB", workspaceId: "wB" }));
    const m = await new CreateMeeting(ctxA).execute({ title: "x", meetingType: "CEREMONY", scheduledAt: "2026-07-12T10:00:00Z" }, "c");
    const fromB = await ctxB.repos.meeting.get("tB", "wB", m.id);
    expect(fromB).toBeNull();
  });

  it("workspace isolation", async () => {
    const a = makeContext(makeIdentity({ tenantId: "t", workspaceId: "w1" }));
    const b = makeContext(makeIdentity({ tenantId: "t", workspaceId: "w2" }));
    const m = await new CreateMeeting(a).execute({ title: "x", meetingType: "CEREMONY", scheduledAt: "2026-07-12T10:00:00Z" }, "c");
    expect(await b.repos.meeting.get("t", "w2", m.id)).toBeNull();
  });

  it("provider failure leaves meeting recoverable + retry succeeds", async () => {
    const ctx = makeContext();
    ctx.transcription = { name: "fail", transcribe: async () => { throw new Error("boom"); } } as any;
    const cid = "c";
    const meeting = await new CreateMeeting(ctx).execute({ title: "x", meetingType: "CEREMONY", scheduledAt: "2026-07-12T10:00:00Z" }, cid);
    await new UploadMeetingAudio(ctx).execute(meeting.id, { file: { bytes: SAMPLE_MP3, fileName: "m.mp3", mimeType: "audio/mpeg" } }, cid);
    await expect(new TranscribeMeetingAudio(ctx).execute(meeting.id, cid)).rejects.toThrow();
    // recover with working provider
    ctx.transcription = { name: "fake", transcribe: (await import("../../src/infrastructure/providers/fake-transcription")).FakeTranscriptionProvider.prototype.transcribe.bind(new (await import("../../src/infrastructure/providers/fake-transcription")).FakeTranscriptionProvider()) } as any;
    const t = await new TranscribeMeetingAudio(ctx).execute(meeting.id, cid);
    expect(t.content.length).toBeGreaterThan(0);
  });

  it("video upload rejected with UNSUPPORTED_MEDIA_TYPE", async () => {
    const ctx = makeContext();
    const meeting = await new CreateMeeting(ctx).execute({ title: "x", meetingType: "CEREMONY", scheduledAt: "2026-07-12T10:00:00Z" }, "c");
    await expect(
      new UploadMeetingAudio(ctx).execute(meeting.id, { file: { bytes: SAMPLE_MP3, fileName: "v.mp4", mimeType: "video/mp4" } }, "c"),
    ).rejects.toMatchObject({ code: ErrorCode.UNSUPPORTED_MEDIA_TYPE });
  });

  it("empty file rejected", async () => {
    const ctx = makeContext();
    const meeting = await new CreateMeeting(ctx).execute({ title: "x", meetingType: "CEREMONY", scheduledAt: "2026-07-12T10:00:00Z" }, "c");
    await expect(
      new UploadMeetingAudio(ctx).execute(meeting.id, { file: { bytes: new Uint8Array(), fileName: "e.mp3", mimeType: "audio/mpeg" } }, "c"),
    ).rejects.toThrow();
  });
});
