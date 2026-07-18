export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  tenantId: string;
  workspaceId: string;
  meetingId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRepo {
  saveSession(session: ChatSession): Promise<void>;
  getSession(tenantId: string, workspaceId: string, id: string): Promise<ChatSession | null>;
  saveMessage(message: ChatMessage): Promise<void>;
  listMessages(sessionId: string): Promise<ChatMessage[]>;
}
