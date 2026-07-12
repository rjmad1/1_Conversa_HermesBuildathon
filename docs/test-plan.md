# Audio-First Test Plan

> Companion to `docs/adr/0002-audio-first-media-scope.md`. No test may require a real
> microphone, camera, or external AI call. Use the deterministic fake transcription provider.

## 1. Audio Upload & Validation

- [ ] **Valid MP3 upload** — `audio/mpeg`, `.mp3`, within size/duration → `201`, `AudioAsset` created.
- [ ] **Valid WAV upload** — `audio/wav`, `.wav` → `201`.
- [ ] **Valid M4A upload** — `audio/mp4`, `.m4a` → `201`.
- [ ] **Video-file rejection** — `video/mp4` (or any `video/*`) → `415 UNSUPPORTED_MEDIA_TYPE`.
- [ ] **Invalid MIME type** — e.g. `image/png` → `415` (or `400` if pre-MIME gate), code distinct from video path.
- [ ] **MIME/extension mismatch** — `.mp3` declared as `audio/wav` → reject (`MIME_EXTENSION_MISMATCH`).
- [ ] **Empty audio** — `sizeBytes === 0` → reject (`EMPTY_FILE`).
- [ ] **Oversize audio** — above `AUDIO_MAX_BYTES` → reject (`FILE_TOO_LARGE`).
- [ ] **Oversize duration** — above `AUDIO_MAX_SECONDS` → reject (`DURATION_EXCEEDED`).
- [ ] **Malformed audio** — corrupt container → reject (`MALFORMED_AUDIO`) where probe feasible.
- [ ] **Sanitized filename** — path/control chars stripped; no local path stored.
- [ ] **Checksum** — `checksum` generated and stored on ingest.

## 2. Transcription

- [ ] **Audio transcription success** — fake provider returns deterministic `Transcript`; `TranscriptionJob` → `READY`.
- [ ] **Transcription failure** — provider error path returns structured `ApiError`; asset → `FAILED`; retry path available.

## 3. Tenant Isolation & Duplicate Handling

- [ ] **Tenant isolation** — asset scoped by `tenantId`/`workspaceId`; cross-tenant read denied.
- [ ] **Duplicate upload handling** — same checksum/meeting → idempotent or rejected per policy.

## 4. Transcript Path (no audio)

- [ ] **Transcript-paste path** — paste transcript → validation → analysis → proposed actions (no transcription call).

## 5. End-to-End

- [ ] **Complete audio-to-action workflow** — upload MP3 → validate → persist → transcribe (fake) → normalize → analyze → propose actions → approve/reject, all with no external AI/mic/camera.

## 6. Test Harness Notes

- Fake transcription provider is the default in test env.
- Sample fixtures: `public/sample-meeting.mp3` (audio only), plus WAV/M4A fixtures and a
  tiny `video/sample-rejected.mp4` used *only* to assert `415`.
- No camera/webcam permission prompts are exercised; UI tests assert absence of such prompts.
