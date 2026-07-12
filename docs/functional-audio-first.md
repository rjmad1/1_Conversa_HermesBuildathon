# Conversa — Functional Specification (Audio-First, MVP)

**Author role:** Principal Product Manager
**Supersedes** the video-framed wording in `FunctionalRequirements.md`. Binding with `docs/adr/0002-audio-first-media-scope.md`.

## 1. Supported Input Channels (this release)

| # | Channel | Status | Notes |
| --- | --- | --- | --- |
| 1 | Audio upload | **Supported** | MP3 / WAV / M4A. |
| 2 | Recorded audio | **Supported** | Imported from meeting platforms as audio. |
| 3 | Live audio stream | Future (designed, not built) | Reuse ingestion pipeline. |
| 4 | Pasted transcript | **Supported** | Plain text. |
| 5 | Imported transcript | **Supported** | From meeting platform / system of record. |

## 2. Core User Stories + Acceptance Criteria

**US-1: Upload audio**
- Given a user with an audio file (MP3/WAV/M4A ≤ limits), when they upload, then an `AudioAsset` is created and transcription starts.
- AC: valid formats accepted; wrong format → `415`/`400` with clear message; progress shown.

**US-2: Paste transcript**
- Given a user pastes ≥10 chars of transcript **and supplies their OpenAI API key (BYOK)**, when submitted, then analysis runs without any audio/transcription step.
- AC: works with no mic; "works" means "works with key" — the paste path still requires the user's key for GPT-4 analysis. No key → clear error, not silent failure.

**US-3: Review & approve actions**
- After analysis, proposed actions show owner/due/priority; user can approve or reject each.
- AC: approval persisted; rejected actions not sent to integrations.

**US-4: Video rejected**
- When any video file is uploaded, the system returns `415 UNSUPPORTED_MEDIA_TYPE`.
- AC: message states only audio (MP3/WAV/M4A) is supported.

**US-5: Retry on failure**
- On transcription/analysis failure, user sees failure state + retry.
- AC: retry re-enters at the correct stage; no duplicate asset if checksum matches.

## 3. Explicitly Out of Scope (this release)

Video ingestion, video recording, camera access, video processing, visual analysis, facial recognition, gesture analysis, screen-content analysis, video playback, interactive video, avatar video, video analytics, video publishing.

## 4. Functional Module Map

- Meeting Management (CRUD + policy)
- Audio Ingestion (validate + persist)
- Transcription (provider interface)
- Transcript Normalization
- Agent Analysis (propose actions)
- Action Approval
- Memory
- Integration (post-approval)
- Governance / Audit

## 5. Open Product Decisions (resolve in first 30 min)

- **Tenant model in MVP — RESOLVED (a):** Use a single **fixed demo tenant** (`tenantId = demo`, `workspaceId = demo`) for MVP. Multi-tenancy is deferred; the extension path is **header-based** (`X-Tenant-Id` / `X-Workspace-Id`) documented in `docs/architecture.md` §6 for later. Do not silently hardcode other values; centralize the default in one config constant.
- **Transcript-only path without API key — RESOLVED (a):** Paste-transcript **requires the user's OpenAI key** (BYOK) for GPT-4 analysis. "Works" = "works with key." Do not claim keyless paste.
- **Sample asset:** ship `public/sample-meeting.mp3` (audio). No video samples except a `video/sample-rejected.mp4` used *only* by tests to assert 415.
