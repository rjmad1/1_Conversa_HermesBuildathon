# Conversa — Audio-First Meeting Intelligence Platform

Conversa turns meetings into completed work. It is an **audio-first** platform: it ingests
meeting **audio** and **transcripts**, transcribes audio, and uses AI agents to propose
governed, approval-gated actions across your stack (Jira, Salesforce, HubSpot, code repos,
internal tools). No video is captured, processed, or played back in this release.

> **Audio-first, not audio-only forever.** Video is a documented future extension
> (see `docs/adr/0002-audio-first-media-scope.md`) but is **not implemented** in this release.

## What Conversa Does (This Release)

- **Audio upload** (MP3, WAV, M4A), **recorded audio**, or **pasted/imported transcript**.
- Validates audio (MIME allowlist, size, duration, empty, extension/MIME, malformed, sanitized name, checksum).
- Persists audio securely with opaque, tenant/workspace-scoped storage references.
- Transcribes audio → transcript (provider behind `AudioTranscriptionProvider.transcribe()`).
- Normalizes transcript (diarization labels, optional redaction).
- Analyzes transcript with agents → proposes actions (owner, due date, system of record).
- Human approves or rejects proposed actions (human-in-the-loop).

## Processing Flow

```text
audio upload
  → validation
  → secure persistence
  → transcription
  → transcript validation
  → meeting analysis
  → proposed actions (approval-gated)
```

The pasted/imported transcript path skips ingestion + transcription and enters at
"transcript validation".

## Supported Inputs

| Channel | Status |
| --- | --- |
| Audio upload (MP3 / WAV / M4A) | Supported |
| Recorded audio | Supported (from meeting platforms) |
| Live audio stream | Future (designed for, not shipped) |
| Pasted transcript | Supported |
| Imported transcript | Supported |

### Supported Audio Formats

- **MP3** (`audio/mpeg`)
- **WAV** (`audio/wav`)
- **M4A** (`audio/mp4`)

Additional formats only when implemented and tested.

## Explicitly Out of Scope (This Release)

Video ingestion, video recording, camera access, video processing, visual analysis,
facial recognition, gesture analysis, screen-content analysis, video playback,
interactive video experiences, avatar video, video analytics, video publishing.

Any video upload is rejected with `UNSUPPORTED_MEDIA_TYPE` (HTTP 415).

## Meeting Platforms Are Audio/Transcript Sources

Conversa integrates with Zoom, Microsoft Teams, Google Meet, and phone bridges as
**sources of meeting audio and transcripts**. These platforms may support video, but
Conversa does not consume or process video. Conversa does not own or build video
conferencing infrastructure.

## Documentation Index

> **Start at `docs/INDEX.md`** — the single source of truth that maps every document and the reading order for builders.

- `docs/INDEX.md` — documentation map + reading order (start here).
- `docs/adr/0002-audio-first-media-scope.md` — the audio-first decision, rationale, consequences, excluded capabilities, future extension strategy.
- `docs/functional-audio-first.md` — agent-facing functional spec: input channels, formats, out-of-scope, user stories + ACs.
- `docs/architecture.md` — system shape, components, data flow, media integration.
- `docs/media-domain-model.md` — normalized media domain (`MediaAsset`, `AudioAsset`, `MediaType`, `AudioFormat`, `AudioSource`, `TranscriptionJob`).
- `docs/media-validation.md` — audio ingestion validation rules and the `UNSUPPORTED_MEDIA_TYPE` error contract.
- `docs/api.md` — audio endpoint (`POST /api/v1/meetings/:meetingId/audio`) and processing flow.
- `docs/ux-design.md` — audio-first UI flow, components, removed video elements, a11y.
- `docs/deployment.md` — hosting decision (Vercel vs Cloudflare), storage layout, env.
- `docs/sre-ops.md` — monitoring, retention job, incident runbooks, DR, cost.
- `docs/non-functional.md` — audio-first NFRs / SLOs.
- `docs/storage-security.md` — opaque, tenant-scoped audio storage; no raw audio in logs.
- `docs/transcription-analysis.md` — separation of ingestion, transcription, and analysis modules.
- `docs/test-plan.md` — audio-first test matrix (no mic/camera/external AI required).
- `docs/acceptance-criteria.md` — audio-first acceptance criteria.

## Requirements & Planning Docs

- `Requirements/Requirements/FunctionalRequirements.md` — full product requirements.
- `Requirements/Requirements/Conversa_Detailed_Implementation_Plan.md` — MVP implementation plan (audio + transcript path).
- `Requirements/Requirements/TechnicalNeeds.md` — technical blueprint.
- `Requirements/Requirements/Expectations from Buildathon.md` — event expectations.
- `Requirements/Requirements/PromptsUsed.md` — prompt provenance.

## Setup & Usage (MVP)

> The MVP is a serverless-First Next.js app (see `Conversa_Detailed_Implementation_Plan.md`).
> It accepts audio upload or transcript paste, transcribes via OpenAI Whisper (BYOK), and
> extracts action items via GPT-4.

1. `npm install`
2. `npm run dev` → open `http://localhost:3000`
3. Enter OpenAI API key (BYOK; never stored server-side).
4. Upload an audio file (MP3/WAV/M4A) **or** paste a transcript.
5. View extracted action items; download JSON results.

### Environment

- MVP requires **no server-side environment variables** (BYOK model).
- When audio validation config is externalized, use (example):
  - `AUDIO_MAX_BYTES=10485760`
  - `AUDIO_MAX_SECONDS=7200`
  - `AUDIO_ALLOWED_MIME_TYPES=audio/mpeg,audio/wav,audio/mp4`
- **No video-related environment variables exist** in this release.

## Limitations

- 60s function timeout (Vercel Pro), 10MB audio limit, no auth/multi-tenancy in MVP.
- Live audio streaming is designed-for but deferred.
- Video is not supported; video uploads are rejected.

## Roadmap

- Multi-tenancy, persistent storage, real-time streaming for long audio.
- Future (documented, not implemented): video ingestion via a new `MediaType`, reusing the
  same pipeline (see ADR 0002). Interactive-video publishing is a longer-term possibility.
