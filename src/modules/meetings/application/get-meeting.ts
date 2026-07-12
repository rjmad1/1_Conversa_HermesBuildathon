import type { AppContext } from "../../app-context";
import type { Meeting } from "../../../shared/validation/schemas";
import { AppError, ErrorCode } from "../../../shared/errors/AppError";

export class GetMeeting {
  constructor(private readonly ctx: AppContext) {}
  async execute(meetingId: string): Promise<Meeting> {
    const m = await this.ctx.repos.meeting.get(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
    if (!m) throw new AppError(ErrorCode.MEETING_NOT_FOUND, "Meeting not found", 404);
    return m;
  }
}
