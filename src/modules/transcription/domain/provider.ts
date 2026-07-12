import type { TranscriptResult } from "../../../shared/validation/schemas";

export interface TranscribeInput {
  audioRef: string;
  mimeType: string;
  correlationId: string;
}

export interface AudioTranscriptionProvider {
  readonly name: string;
  transcribe(input: TranscribeInput): Promise<TranscriptResult>;
}
