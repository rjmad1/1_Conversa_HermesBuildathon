import type { AppContext } from "../../app-context";
import type { MeetingAnalysis } from "../../../shared/validation/schemas";
import { AppError, ErrorCode } from "../../../shared/errors/AppError";

export class GetMeetingAnalysis {
  constructor(private readonly ctx: AppContext) {}
  async execute(meetingId: string): Promise<MeetingAnalysis> {
    const a = await this.ctx.repos.meetingAnalysis.getByMeeting(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
    if (!a) throw new AppError(ErrorCode.NOT_FOUND, "Analysis not found", 404);
    return a;
  }
}
