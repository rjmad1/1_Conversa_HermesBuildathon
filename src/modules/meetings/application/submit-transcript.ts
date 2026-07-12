import { randomUUID } from "node:crypto";
import type { AppContext } from "../../app-context";
import { auditMeta } from "../../app-context";
import type { Transcript } from "../../../shared/validation/schemas";
import { AppError, ErrorCode } from "../../../shared/errors/AppError";
import { logger } from "../../../shared/logging/logger";

export interface SubmitTranscriptInput {
  content: string;
  language?: string;
  source?: "PASTE" | "IMPORT";
}

export class SubmitMeetingTranscript {
  constructor(private readonly ctx: AppContext) {}
  async execute(meetingId: string, input: SubmitTranscriptInput, correlationId: string): Promise<Transcript> {
    if (!input || typeof input.content !== "string") {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Transcript content is required and must be a string", 400);
    }
    const min = 10;
    const max = 50000;
    const content = input.content.replace(/\s+/g, " ").trim();
    if (content.length < min) throw new AppError(ErrorCode.VALIDATION_ERROR, "Transcript too short", 400, { received: content.length, allowed: min });
    if (content.length > max) throw new AppError(ErrorCode.VALIDATION_ERROR, "Transcript too long", 400, { received: content.length, allowed: max });

    const meeting = await this.ctx.repos.meeting.get(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
    if (!meeting) throw new AppError(ErrorCode.MEETING_NOT_FOUND, "Meeting not found", 404);

    const existing = await this.ctx.repos.transcript.findByMeeting(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
    const dup = existing.find((t) => t.content === content && t.source === (input.source ?? "PASTE"));
    if (dup) {
      await this.ctx.audit.record({
        ...auditMeta(this.ctx, meetingId, correlationId),
        entityType: "TRANSCRIPT",
        entityId: dup.id,
        eventType: "TRANSCRIPT_DUPLICATE_SKIPPED",
        metadata: {},
      });
      return dup;
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const transcript: Transcript = {
      id,
      tenantId: this.ctx.identity.tenantId,
      workspaceId: this.ctx.identity.workspaceId,
      meetingId,
      source: input.source ?? "PASTE",
      language: input.language ?? "en",
      content,
      segments: [],
      status: "READY",
      createdAt: now,
      updatedAt: now,
    };
    await this.ctx.repos.transcript.save(transcript);
    await this.ctx.audit.record({
      ...auditMeta(this.ctx, meetingId, correlationId),
      entityType: "TRANSCRIPT",
      entityId: id,
      eventType: "TRANSCRIPT_SUBMITTED",
      metadata: { source: transcript.source, length: content.length },
    });
    logger.info({ operation: "SubmitMeetingTranscript", correlationId, outcome: "success" }, "transcript submitted");
    return transcript;
  }
}
