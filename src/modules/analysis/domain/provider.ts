import type { MeetingAnalysis } from "../../../shared/validation/schemas";
import type { ChatMessage } from "./chat";

export interface AnalyzeInput {
  transcriptContent: string;
  language: string;
  meetingId: string;
  correlationId: string;
}

export interface ChatInput {
  transcriptContent: string;
  messages: ChatMessage[];
  correlationId: string;
}

export interface MeetingAnalysisProvider {
  readonly name: string;
  analyze(input: AnalyzeInput): Promise<MeetingAnalysis>;
  chat(input: ChatInput): Promise<string>;
}
