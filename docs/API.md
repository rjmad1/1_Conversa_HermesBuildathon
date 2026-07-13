# Audio API Specification

> Companion to `docs/adr/0002-audio-first-media-scope.md`. Audio-first endpoints only.

## 1. Preferred Audio Endpoint

```text
POST /api/v1/meetings/:meetingId/audio
```

- **Auth:** user or service token (RBAC: `meeting:write` within tenant/workspace).
- **Content-Type:** `multipart/form-data`
  - `file` — audio file (MP3/WAV/M4A), validated per `docs/media-validation.md`.
  - `apiKey?` — only if BYOK mode is active (never stored server-side).
- **Success:** `201 Created` with `AudioAsset` metadata (no raw bytes).
- **Failure:** `415 UNSUPPORTED_MEDIA_TYPE` for video; `400` for other validation errors.

## 2. Transcript Endpoint (unchanged, audio-first)

```text
POST /api/v1/meetings/:meetingId/transcript   # paste/import transcript
POST /api/v1/meetings/:meetingId/transcript/:transcriptId/actions  # extract + approve actions
```

## 3. Processing Flow

```text
audio upload
  → validation            (MIME allowlist, size, duration, empty, ext/MIME, malformed, sanitized name, checksum)
  → secure persistence    (opaque, tenant/workspace-scoped storage reference; raw audio NOT in relational record)
  → transcription         (AudioTranscriptionProvider.transcribe(input): Transcript)
  → transcript validation (normalize, redact if configured)
  → meeting analysis      (agent proposes actions from validated transcript)
  → proposed actions      (human approves or rejects)
```

The **pasted/imported transcript** path skips ingestion + transcription and enters at
"transcript validation".

## 4. Hard Constraints

- **No camera or video permissions** are requested or documented in any API or browser flow.
- **No video endpoint** accepts media in this release. Any video upload → `415 UNSUPPORTED_MEDIA_TYPE`.
- Transcription and analysis are **separate modules**; the API wires them but does not
  co-locate their logic in route handlers.
- No business logic lives in route handlers; handlers delegate to services.

## 5. Future (not implemented)

```text
POST /api/v1/meetings/:meetingId/video   # reserved; gated by media.video.enabled=false
```

Documented only to preserve the extension point; returns `404` / `503` until enabled.
