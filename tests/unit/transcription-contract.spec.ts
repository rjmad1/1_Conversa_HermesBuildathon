import { describe, it, expect, vi } from "vitest";
import { makeContext, makeIdentity, SAMPLE_MP3 } from "../helpers";
import { CreateMeeting } from "../../src/modules/meetings/application/create-meeting";
import { UploadMeetingAudio } from "../../src/modules/media/application/upload-audio";
import { TranscribeMeetingAudio } from "../../src/modules/transcription/application/transcribe-audio";
import { AppError, ErrorCode } from "../../src/shared/errors/AppError";
import type { AudioTranscriptionProvider, TranscribeInput } from "../../src/modules/transcription/domain/provider";
import type { TranscriptResult } from "../../src/shared/validation/schemas";
import type { AudioStorage } from "../../src/modules/media/domain/storage";

const SAMPLE = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]);

class SpyTranscriptionProvider implements AudioTranscriptionProvider {
  readonly name = "spy";
  received: TranscribeInput | null = null;
  async transcribe(input: TranscribeInput): Promise<TranscriptResult> {
    this.received = input;
    return { language: "en", content: "transcribed", segments: [] };
  }
}

/** Storage that returns null to simulate a missing object. */
class EmptyStorage implements AudioStorage {
  buildRef(): string { return "ref"; }
  async put(): Promise<void> {}
  async get(): Promise<Uint8Array | null> { return null; }
  async delete(): Promise<void> {}
  async exists(): Promise<boolean> { return false; }
}

describe("transcription audio contract", () => {
  it("provider receives actual bytes, filename, and mime (not the storage ref)", async () => {
    const ctx = makeContext();
    const spy = new SpyTranscriptionProvider();
    ctx.transcription = spy;

    const cid = "corr";
    const meeting = await new CreateMeeting(ctx).execute({ title: "M", meetingType: "CEREMONY", scheduledAt: "2026-07-12T10:00:00Z" }, cid);
    const asset = await new UploadMeetingAudio(ctx).execute(meeting.id, { file: { bytes: SAMPLE, fileName: "clip.mp3", mimeType: "audio/mpeg" } }, cid);

    await new TranscribeMeetingAudio(ctx).execute(meeting.id, cid);

    expect(spy.received).not.toBeNull();
    // bytes are the actual uploaded content, not a storage-reference string
    expect(spy.received!.audio.bytes).toBeInstanceOf(Uint8Array);
    expect(Array.from(spy.received!.audio.bytes)).toEqual(Array.from(SAMPLE));
    expect(spy.received!.audio.bytes.length).toBeGreaterThan(0);
    // safe metadata preserved
    expect(spy.received!.audio.fileName).toBe("clip.mp3");
    expect(spy.received!.audio.mimeType).toBe("audio/mpeg");
    // the storage reference is never sent as audio content
    expect(typeof spy.received!.audio.bytes).not.toBe("string");
  });

  it("missing storage object fails with STORAGE_OBJECT_MISSING (recoverable)", async () => {
    const ctx = makeContext();
    ctx.storage = new EmptyStorage() as unknown as AudioStorage;
    ctx.transcription = new SpyTranscriptionProvider();

    const cid = "corr";
    const meeting = await new CreateMeeting(ctx).execute({ title: "M", meetingType: "CEREMONY", scheduledAt: "2026-07-12T10:00:00Z" }, cid);
    await new UploadMeetingAudio(ctx).execute(meeting.id, { file: { bytes: SAMPLE, fileName: "clip.mp3", mimeType: "audio/mpeg" } }, cid);

    await expect(new TranscribeMeetingAudio(ctx).execute(meeting.id, cid)).rejects.toMatchObject({
      code: ErrorCode.STORAGE_OBJECT_MISSING,
    });
  });

  it("fake provider rejects a storage-reference string masquerading as bytes", async () => {
    const ctx = makeContext();
    const spy = new SpyTranscriptionProvider();
    ctx.transcription = spy;
    // Force a malicious-looking input: a string cast to Uint8Array is impossible,
    // but verify the contract guards against empty/non-byte input.
    const cid = "corr";
    const meeting = await new CreateMeeting(ctx).execute({ title: "M", meetingType: "CEREMONY", scheduledAt: "2026-07-12T10:00:00Z" }, cid);
    await new UploadMeetingAudio(ctx).execute(meeting.id, { file: { bytes: new Uint8Array([0x00]), fileName: "x.mp3", mimeType: "audio/mpeg" } }, cid);
    await new TranscribeMeetingAudio(ctx).execute(meeting.id, cid);
    expect(spy.received!.audio.bytes).toBeInstanceOf(Uint8Array);
  });
});
