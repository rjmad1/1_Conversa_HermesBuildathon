# Transcription & Analysis Separation

> Companion to `docs/adr/0002-audio-first-media-scope.md`. Enforces the architectural
> constraint that audio ingestion, transcription, and meeting analysis remain separate modules.

## 1. Module Boundaries

| Module | Responsibility | Input | Output |
| --- | --- | --- | --- |
| Audio Ingestion | Validate + persist audio; produce `AudioAsset`. | upload / recorded audio | `AudioAsset` (stored) |
| Transcription | Convert audio → text. | `AudioAsset` (via `TranscriptionJob`) | `Transcript` |
| Transcript Normalization | Clean, diarize labels, redact (if configured). | `Transcript` | normalized `Transcript` |
| Meeting Analysis | Reason over validated transcript → proposed actions. | normalized `Transcript` + context | proposed `ActionItem[]` |
| Action Approval | Human approves/rejects proposed actions. | proposed `ActionItem[]` | executed/recorded actions |

## 2. Provider Interface

Provider-specific transcription is isolated behind an interface so it can be swapped or
faked without touching ingestion or analysis:

```text
AudioTranscriptionProvider.transcribe(input): Transcript
```

- `input` carries the `AudioAsset` reference (not raw bytes passed around the app).
- Implementations: OpenAI Whisper (BYOK), Wispr Flow (dictation), local/Ollama fallback.
- A **deterministic fake transcription provider** is provided for tests (returns a fixed,
  predictable `Transcript` for a given input) so no test requires a real microphone,
  camera, or external AI call.

## 3. AI Analysis Input Contract

The AI analysis layer consumes **validated transcripts**, never raw audio. This keeps:

- analysis testable without audio,
- transcription swappable,
- the audio pipeline free of LLM/business logic.

## 4. Constraints

- No business logic in UI components or route handlers.
- Transcription and analysis MUST remain separate modules (no merging).
- Pasted/imported transcripts enter at "Transcript Normalization" — same downstream path.
