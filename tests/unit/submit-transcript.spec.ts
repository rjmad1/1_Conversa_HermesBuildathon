import { describe, it, expect } from "vitest";
import { makeContext } from "../helpers";
import { SubmitMeetingTranscript } from "../../src/modules/meetings/application/submit-transcript";
import { CreateMeeting } from "../../src/modules/meetings/application/create-meeting";
import { AppError } from "../../src/shared/errors/AppError";

describe("unit: SubmitMeetingTranscript validation guard", () => {
  it("rejects missing request input (undefined)", async () => {
    const ctx = makeContext();
    const service = new SubmitMeetingTranscript(ctx);
    // @ts-ignore
    await expect(service.execute("meeting-id", undefined, "corr")).rejects.toThrow(AppError);
  });

  it("rejects null request input", async () => {
    const ctx = makeContext();
    const service = new SubmitMeetingTranscript(ctx);
    // @ts-ignore
    await expect(service.execute("meeting-id", null, "corr")).rejects.toThrow(AppError);
  });

  it("rejects missing content (undefined)", async () => {
    const ctx = makeContext();
    const service = new SubmitMeetingTranscript(ctx);
    // @ts-ignore
    await expect(service.execute("meeting-id", { language: "en" }, "corr")).rejects.toThrow(AppError);
  });

  it("rejects null content", async () => {
    const ctx = makeContext();
    const service = new SubmitMeetingTranscript(ctx);
    // @ts-ignore
    await expect(service.execute("meeting-id", { content: null }, "corr")).rejects.toThrow(AppError);
  });

  it("rejects non-string content", async () => {
    const ctx = makeContext();
    const service = new SubmitMeetingTranscript(ctx);
    // @ts-ignore
    await expect(service.execute("meeting-id", { content: 12345 }, "corr")).rejects.toThrow(AppError);
  });

  it("rejects empty string content", async () => {
    const ctx = makeContext();
    const service = new SubmitMeetingTranscript(ctx);
    await expect(service.execute("meeting-id", { content: "" }, "corr")).rejects.toThrow(AppError);
  });

  it("rejects whitespace-only content", async () => {
    const ctx = makeContext();
    const service = new SubmitMeetingTranscript(ctx);
    await expect(service.execute("meeting-id", { content: "         " }, "corr")).rejects.toThrow(AppError);
  });

  it("accepts valid transcript and saves it", async () => {
    const ctx = makeContext();
    const meeting = await new CreateMeeting(ctx).execute({ title: "Test", meetingType: "CEREMONY", scheduledAt: "2026-07-12T10:00:00Z" }, "corr");
    const service = new SubmitMeetingTranscript(ctx);
    const result = await service.execute(meeting.id, { content: "This is a valid transcript of sufficient length." }, "corr");
    expect(result.id).toBeTruthy();
    expect(result.content).toBe("This is a valid transcript of sufficient length.");
    
    // Valid transcript still reaches the intended use case
    const saved = await ctx.repos.transcript.findByMeeting(ctx.identity.tenantId, ctx.identity.workspaceId, meeting.id);
    expect(saved.length).toBe(1);
    expect(saved[0]?.content).toBe("This is a valid transcript of sufficient length.");
  });
});
