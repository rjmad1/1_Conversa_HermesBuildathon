# Conversa — MVP 3-Hour Cut-Line (Brutal Priority)

**Author role:** VP Product / Delivery Lead
**Purpose:** Given ~3 hours, tell agents exactly what to build, what to fake, and what to defer. Everything here is consistent with `docs/INDEX.md` and the resolved decisions in `docs/deployment.md` + `docs/architecture.md` §6.

## MUST BUILD (claims AC #1–#10)

1. **Audio ingestion + validation** (`docs/media-validation.md`): MIME allowlist (MP3/WAV/M4A), size/duration limits, empty reject, ext/MIME consistency, sanitized filename, checksum, **video → 415 `UNSUPPORTED_MEDIA_TYPE`**.
2. **Secure persistence to R2** (opaque `assetId`, `tenants/{tenantId}/workspaces/{workspaceId}/media/{assetId}`), demo tenant.
3. **Transcription** via `AudioTranscriptionProvider.transcribe()` (OpenAI Whisper, BYOK). **Fake provider** for tests.
4. **Paste-transcript path** (requires user key) → analysis, no audio step.
5. **Analysis (GPT-4, BYOK)** → proposed `ActionItem[]` (owner/due/priority).
6. **Approval/reject UI** + JSON download.
7. **UI flow** (`docs/ux-design.md`): upload + paste cards, progress, failure/retry, transcript review, action approval. **No camera/video elements.**
8. **Tests** (`docs/test-plan.md` floor): MP3/WAV/M4A upload, video 415, invalid MIME, mismatch, empty, oversize, transcription success (fake), tenant isolation, paste path, full audio→action (fake).
9. **Audio-first docs already done** — link `docs/INDEX.md` from README/UI.

## FAKE / STUB (acceptable for demo, label clearly)
- Real-time streaming (deferred; batch only).
- Multi-tenancy (fixed demo tenant; header path documented, off).
- Live dictation (Wispr) — batch upload only.
- ElevenLabs voice output — **out of MVP** (input-only).
- Retention job — documented debt if dropped; label as not-in-MVP.
- Integrations (Jira/Salesforce) — show proposed actions; actual push post-MVP unless trivial.

## DEFER (do NOT build; would blow the clock)
- Any video capture/processing/playback/camera.
- Visual/facial/gesture/screen analysis.
- Interactive-video publishing.
- Auth/RBAC (demo tenant; header extension documented).
- Calendar auto-capture.
- Persistent DB migration beyond D1/KV.

## DEMO SANITY (do last 20 min)
- `sample-meeting.mp3` present + a short real clip transcribed end-to-end.
- Video file upload shows clear 415 message.
- Paste-transcript path works with key.
- Retry path demonstrable on a forced failure.

## Risk if cut-line ignored
Building video, auth, or live streaming = guaranteed non-delivery. The audio→action loop is the whole demo.
