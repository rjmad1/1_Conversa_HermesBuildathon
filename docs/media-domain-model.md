# Media Domain Model (Audio-First)

> Companion to `docs/adr/0002-audio-first-media-scope.md`. Defines the modality-neutral
> media domain used by Conversa. Only `AUDIO` is active in this release.

## 1. Design Principles

- **Modality-neutral base, audio-specific behavior.** Use `MediaAsset` as the common
  base so a future `VIDEO` type reuses the same lifecycle (ingest → validate →
  persist → transcribe → analyze) without duplicating models.
- **No duplicate audio/media models.** A single `MediaAsset` hierarchy represents all
  media; `AudioAsset` specializes it. There is no separate parallel "audio" model.
- **Tenant and workspace scoped everywhere.** Every persisted media record carries
  `tenantId` and `workspaceId`.
- **Transcripts are first-class, not media.** `TranscriptionJob` is a separate entity
  that consumes a `MediaAsset` and produces a `Transcript`.

## 2. Domain Concepts

| Concept | Kind | Responsibility |
| --- | --- | --- |
| `MediaAsset` | base entity | Common identity, storage reference, status, metadata for any media. |
| `MediaType` | enum | Modality discriminator. Active value: `AUDIO`. `VIDEO` reserved, not active. |
| `AudioAsset` | entity (specializes `MediaAsset`) | Audio-specific metadata: format, duration, codec-agnostic. |
| `AudioFormat` | enum/value | `MP3`, `WAV`, `M4A`. Additional formats only when implemented and tested. |
| `AudioSource` | enum/value | `UPLOAD`, `RECORDED`, `LIVE_STREAM` (future), `TRANSCRIPT_PASTE`, `TRANSCRIPT_IMPORT`. |
| `TranscriptionJob` | entity | Maps a `MediaAsset` → `Transcript`; tracks provider, status, duration. |

## 3. `MediaType` Enum

```text
MediaType:
  AUDIO   # active in this release
  # VIDEO # reserved for future release; NOT active. Reject if persisted unexpectedly.
```

If a persistence record ever carries `VIDEO`, application validation and feature
configuration MUST reject it (`UNSUPPORTED_MEDIA_TYPE` / feature flag off).

## 4. `AudioAsset` Minimum Metadata

| Field | Type | Notes |
| --- | --- | --- |
| `id` | UUID | Opaque asset identifier. |
| `tenantId` | UUID | Tenant scope (required). |
| `workspaceId` | UUID | Workspace scope (required). |
| `meetingId` | UUID | Owning meeting. |
| `source` | `AudioSource` | How the audio entered the system. |
| `fileName` | string | Sanitized original filename (never a local path). |
| `mimeType` | string | Audio MIME from allowlist (`audio/mpeg`, `audio/wav`, `audio/mp4`). |
| `format` | `AudioFormat` | `MP3` \| `WAV` \| `M4A`. |
| `sizeBytes` | int | Validated against configurable limit. |
| `durationSeconds` | float | Validated against configurable limit. |
| `storageReference` | string | Opaque, tenant/workspace-scoped object-storage reference. |
| `checksum` | string | Integrity checksum (e.g. SHA-256). |
| `status` | enum | `PENDING` \| `VALIDATING` \| `STORED` \| `TRANSCRIBING` \| `READY` \| `FAILED` \| `REJECTED`. |
| `createdAt` | timestamp | RFC3339. |
| `updatedAt` | timestamp | RFC3339. |

## 5. Supported Initial Formats

- **MP3** (`audio/mpeg`)
- **WAV** (`audio/wav`)
- **M4A** (`audio/mp4`)

Additional formats are supported only when implemented and covered by tests.

## 6. Relationship to Meeting Domain

```text
MEETING 1──* MEDIA_ASSET (AudioAsset)
MEDIA_ASSET 1──1 TRANSCRIPTION_JOB
TRANSCRIPTION_JOB 1──1 TRANSCRIPT
TRANSCRIPT 1──* ACTION_ITEM (proposed, approval-gated)
```

The meeting domain is unchanged by the modality-neutral media base; only the media
subdomain gains the `AudioAsset` specialization.
