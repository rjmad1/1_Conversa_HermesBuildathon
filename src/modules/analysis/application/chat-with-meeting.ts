import { randomUUID } from "node:crypto";
import type { AppContext } from "../../app-context";
import { AppError, ErrorCode } from "../../../shared/errors/AppError";
import type { ChatSession, ChatMessage } from "../domain/chat";

export class ChatWithMeeting {
  constructor(private readonly ctx: AppContext) {}

  async execute(meetingId: string, messageContent: string, sessionId?: string, correlationId: string = randomUUID()): Promise<{ sessionId: string; reply: string }> {
    const tenantId = this.ctx.identity.tenantId;
    const workspaceId = this.ctx.identity.workspaceId;

    // 1. Verify meeting exists
    const meeting = await this.ctx.repos.meeting.get(tenantId, workspaceId, meetingId);
    if (!meeting) {
      throw new AppError(ErrorCode.NOT_FOUND, "Meeting not found", 404);
    }

    // 2. Fetch transcript
    const transcripts = await this.ctx.repos.transcript.findByMeeting(tenantId, workspaceId, meetingId);
    if (transcripts.length === 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "No transcript available for this meeting to chat about", 400);
    }
    // We assume the most recent transcript is the best one if multiple exist, or just the first.
    const transcript = transcripts.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]!;

    // 3. Load or create chat session
    let session: ChatSession;
    if (sessionId) {
      const existing = await this.ctx.repos.chat.getSession(tenantId, workspaceId, sessionId);
      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, "Chat session not found", 404);
      }
      session = existing;
    } else {
      session = {
        id: randomUUID(),
        tenantId,
        workspaceId,
        meetingId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await this.ctx.repos.chat.saveSession(session);
    }

    // 4. Save user message
    const userMessage: ChatMessage = {
      id: randomUUID(),
      sessionId: session.id,
      role: "user",
      content: messageContent,
      createdAt: new Date().toISOString()
    };
    await this.ctx.repos.chat.saveMessage(userMessage);

    // 5. Load history for context
    const messages = await this.ctx.repos.chat.listMessages(session.id);

    // 6. Call provider
    const replyContent = await this.ctx.analysis.chat({
      transcriptContent: transcript.content,
      messages, // This includes the user message we just saved
      correlationId
    });

    // 7. Save assistant message
    const assistantMessage: ChatMessage = {
      id: randomUUID(),
      sessionId: session.id,
      role: "assistant",
      content: replyContent,
      createdAt: new Date().toISOString()
    };
    await this.ctx.repos.chat.saveMessage(assistantMessage);

    // 8. Update session timestamp
    session.updatedAt = new Date().toISOString();
    await this.ctx.repos.chat.saveSession(session);

    return {
      sessionId: session.id,
      reply: replyContent
    };
  }
}
