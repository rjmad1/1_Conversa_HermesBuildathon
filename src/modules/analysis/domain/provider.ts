import type { MeetingAnalysis } from "../../../shared/validation/schemas";

export interface AnalyzeInput {
  transcriptContent: string;
  language: string;
  meetingId: string;
  correlationId: string;
}

export interface MeetingAnalysisProvider {
  readonly name: string;
  analyze(input: AnalyzeInput): Promise<MeetingAnalysis>;
}
