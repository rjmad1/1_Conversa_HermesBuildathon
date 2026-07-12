import { randomUUID } from "node:crypto";
import type { AppContext } from "../app-context";
import type { Meeting, CreateMeetingInput } from "../../shared/validation/schemas";
import { CreateMeetingInputSchema } from "../../shared/validation/schemas";
import { AppError, ErrorCode } from "../../shared/errors/AppError";
import { logger } from "../../shared/logging/logger";

export class CreateMeeting {
  constructor(private readonly ctx: AppContext) {}
  async execute(input: unknown, correlationId: string): Promise<Meeting> {
    const parsed = CreateMeetingInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Invalid meeting input", 400, parsed.error.issues as never);
    }
    const now = new Date().toISOString();
    const meeting: Meeting = {
      id: randomUUID(),
      tenantId: this.ctx.identity.tenantId,
      workspaceId: this.ctx.identity.workspaceId,
      title: parsed.data.title,
      meetingType: parsed.data.meetingType,
      status: "DRAFT",
      scheduledAt: parsed.data.scheduledAt,
      createdBy: this.ctx.identity.actorId,
      createdAt: now,
      updatedAt: now,
    };
    await this.ctx.repos.meeting.save(meeting);
    await this.ctx.audit.record({
      ...this.auditMeta(meeting.id, correlationId),
      entityType: "MEETING",
      entityId: meeting.id,
      eventType: "MEETING_CREATED",
      metadata: { title: meeting.title },
    });
    logger.info({ operation: "CreateMeeting", correlationId, outcome: "success" }, "meeting created");
    return meeting;
  }
  private auditMeta(meetingId: string, correlationId: string) {
    return {
      tenantId: this.ctx.identity.tenantId,
      workspaceId: this.ctx.identity.workspaceId,
      meetingId,
      actorType: this.ctx.identity.actorType,
      actorId: this.ctx.identity.actorId,
      correlationId,
    };
  }
}
