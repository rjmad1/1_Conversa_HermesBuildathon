import type { AppContext } from "../../app-context";
import type { AuditEvent } from "../../../shared/validation/schemas";
import { AppError, ErrorCode } from "../../../shared/errors/AppError";

export class ListMeetingAuditEvents {
  constructor(private readonly ctx: AppContext) {}
  async execute(meetingId: string): Promise<AuditEvent[]> {
    const m = await this.ctx.repos.meeting.get(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
    if (!m) throw new AppError(ErrorCode.MEETING_NOT_FOUND, "Meeting not found", 404);
    return this.ctx.repos.audit.listByMeeting(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
  }
}
