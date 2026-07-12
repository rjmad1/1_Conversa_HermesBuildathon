import type { TranscriptResult } from "../../../shared/validation/schemas";

/** Application-level audio input passed to transcription providers. */
export interface TranscriptionAudioInput {
  bytes: Uint8Array;
  fileName: string;
  mimeType: string;
}

export interface TranscribeInput {
  audio: TranscriptionAudioInput;
  correlationId: string;
}

export interface AudioTranscriptionProvider {
  readonly name: string;
  transcribe(input: TranscribeInput): Promise<TranscriptResult>;
}
