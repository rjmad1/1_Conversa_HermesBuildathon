import type { AudioTranscriptionProvider, TranscribeInput } from "../../modules/transcription/domain/provider";
import type { TranscriptResult } from "../../shared/validation/schemas";

/**
 * Deterministic fake provider. No network, no API key, no randomness.
 * Produces a fixed, valid transcript so tests/CI need no microphone or external AI.
 */
export class FakeTranscriptionProvider implements AudioTranscriptionProvider {
  readonly name = "fake";
  async transcribe(_input: TranscribeInput): Promise<TranscriptResult> {
    return {
      language: "en",
      content:
        "Team agreed to launch the beta on the 15th. Priya owns the launch checklist. " +
        "We decided to defer the billing integration. Rajeev will draft the RFC by Friday.",
      segments: [
        { speaker: "Priya", startMs: 0, endMs: 4000, text: "We will launch the beta on the 15th; I own the checklist." },
        { speaker: "Rajeev", startMs: 4000, endMs: 8000, text: "I will draft the RFC by Friday." },
        { speaker: null, startMs: 8000, endMs: 11000, text: "We decided to defer the billing integration." },
      ],
    };
  }
}

export class FailingTranscriptionProvider implements AudioTranscriptionProvider {
  readonly name = "fake-failing";
  async transcribe(_input: TranscribeInput): Promise<TranscriptResult> {
    throw new Error("transcription provider unavailable");
  }
}
