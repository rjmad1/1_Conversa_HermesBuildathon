# Audio-First Acceptance Criteria

> Companion to `docs/adr/0002-audio-first-media-scope.md`. Mirrors the build acceptance list.

1. **No active product flow requires video.** Every user journey uses audio or transcript.
2. **No UI requests camera access.** No webcam permission prompts, video preview, or camera controls.
3. **No current API accepts video.** Video uploads return `UNSUPPORTED_MEDIA_TYPE` (`415`).
4. **Video uploads rejected** with stable code `UNSUPPORTED_MEDIA_TYPE` and clear message.
5. **MP3, WAV, M4A** follow the validated transcription flow (upload → validate → persist → transcribe → analyze).
6. **Pasted transcripts** continue to work (no audio required).
7. **Audio ingestion and meeting analysis** remain separate modules.
8. **Documentation** consistently describes an audio-first platform.
9. **Future video support** is documented (ADR 0002 + future extension strategy) but not implemented.
10. **Lint, type-check, tests, and production build** pass (when code is present).

## Out-of-Scope (explicitly excluded this release)

Video ingestion, video recording, camera access, video processing, visual analysis,
facial recognition, gesture analysis, screen-content analysis, video playback,
interactive video experiences, avatar video, video analytics, video publishing.

## Retained External References (justification)

- "Video conferencing infrastructure ownership" / "video infra" — retained as an
  **out-of-scope external meeting-platform reference**. Conversa integrates with
  Zoom/Teams/Google Meet as sources of meeting **audio and transcripts**; it does not
  build or own video-conferencing infrastructure. This is not a Conversa video feature.
