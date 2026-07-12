import { randomUUID } from "node:crypto";
import type { AppContext } from "../../app-context";
import { auditMeta } from "../../app-context";
import type { Transcript } from "../../../shared/validation/schemas";
import { AppError, ErrorCode } from "../../../shared/errors/AppError";
import { logger } from "../../../shared/logging/logger";

export class TranscribeMeetingAudio {
  constructor(private readonly ctx: AppContext) {}
  async execute(meetingId: string, correlationId: string): Promise<Transcript> {
    const audio = await this.ctx.repos.audio.findByMeeting(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
    const target = audio.find((a) => a.status === "STORED" || a.status === "READY") ?? audio[0];
    if (!target) throw new AppError(ErrorCode.VALIDATION_ERROR, "No audio asset to transcribe", 400);

    const exists = await this.ctx.repos.transcript.findByMeeting(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
    const prior = exists.find((t) => t.source === "TRANSCRIPTION");
    if (prior) return prior;

    const bytes = await this.ctx.storage.get(target.storageReference);
    if (!bytes) throw new AppError(ErrorCode.STORAGE_OBJECT_MISSING, "Audio bytes unavailable for transcription", 410, { storageReference: "[redacted-content]" });

    try {
      const result = await this.ctx.transcription.transcribe({
        audio: { bytes, fileName: target.fileName, mimeType: target.mimeType },
        correlationId,
      });
      const id = randomUUID();
      const now = new Date().toISOString();
      const transcript: Transcript = {
        id,
        tenantId: this.ctx.identity.tenantId,
        workspaceId: this.ctx.identity.workspaceId,
        meetingId,
        source: "TRANSCRIPTION",
        language: result.language,
        content: result.content,
        segments: result.segments,
        status: "READY",
        createdAt: now,
        updatedAt: now,
      };
      await this.ctx.repos.transcript.save(transcript);
      await this.ctx.audit.record({
        ...auditMeta(this.ctx, meetingId, correlationId),
        entityType: "TRANSCRIPT",
        entityId: id,
        eventType: "TRANSCRIPT_CREATED",
        metadata: { source: "TRANSCRIPTION" },
      });
      logger.info({ operation: "TranscribeMeetingAudio", correlationId, outcome: "success" }, "transcription complete");
      return transcript;
    } catch (err) {
      logger.error({ operation: "TranscribeMeetingAudio", correlationId, outcome: "failure" }, "transcription failed");
      await this.ctx.audit.record({
        ...auditMeta(this.ctx, meetingId, correlationId),
        entityType: "MEETING",
        entityId: meetingId,
        eventType: "TRANSCRIPTION_FAILED",
        metadata: { error: String((err as Error).message) },
      });
      throw new AppError(ErrorCode.TRANSCRIPTION_FAILED, "Transcription failed; meeting remains recoverable", 502, undefined, true);
    }
  }
}
