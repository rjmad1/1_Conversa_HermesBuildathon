# ADR 0003: Audio-to-Governed-Action Foundation

- **Status:** Accepted
- **Date:** 2026-07-12
- **Supersedes:** MVP plan's Vercel/Next.js assumption (superseded by Cloudflare decision in `docs/deployment.md`)
- **Related:** ADR 0002 (audio-first media scope)

---

## 1. Audio-First Scope (reaffirmed)

Only audio (MP3/WAV/M4A) and pasted/imported transcripts are inputs. Video uploads return `UNSUPPORTED_MEDIA_TYPE` (415). No camera, no video, no streaming, no meeting-platform connectors, no Jira/CRM/Slack writes, no billing, no autonomous execution, no vector search, no knowledge graph this milestone.

## 2. Modular-Monolith Decision

Single deployable (Cloudflare Worker) with internal module boundaries:
`meetings`, `media`, `transcription`, `analysis`, `approvals`, `audit`, plus `shared`.
Each module splits into `domain` (entities/contracts, no framework), `application` (use cases), `infrastructure` (repos, providers, storage), and `presentation` (HTTP routes / UI). Framework code (Hono) contains **no domain logic**; route handlers delegate to application use cases.

## 3. Persistence Decision

- **Chosen:** Cloudflare **D1** (SQLite) for structured records; **R2** for audio bytes.
- Rationale: relational shape matches the entity set; D1 is Workers-native; R2 satisfies "audio not in DB records" and opaque tenant-scoped references.
- **For dev/test:** an **in-memory** repository + storage implementation behind the same interfaces, so CI and offline dev need no Cloudflare account. Production swaps the binding (D1/R2) via dependency injection; no use-case code changes.
- Every business record carries `tenantId` + `workspaceId`; queries enforce both. Indexes on tenant/workspace/meeting/status. Audit events append-only.

## 4. AI-Provider Abstraction

`MeetingAnalysisProvider.analyze(input): MeetingAnalysis` — OpenAI implementation + deterministic fake.
- Server-side key only (no browser key input).
- Low-temperature, deterministic config; schema-validated structured output.
- No provider types leak into domain; domain depends on the interface only.
- Malformed output rejected; partial output never persisted as completed.

## 5. Transcription-Provider Abstraction

`AudioTranscriptionProvider.transcribe(input): TranscriptResult` — OpenAI Whisper implementation + deterministic fake.
- Server-side key; env validation; configurable model/timeout; bounded retries.
- Produces **normalized transcript only**; performs no analysis.
- Correlation ID, latency metadata, no raw audio in logs.

## 6. Tenant-Ready Design

- Fixed demo tenant (`demo`/`demo`) centralized in config; header-based `X-Tenant-Id`/`X-Workspace-Id` extension path documented, inactive until auth.
- All repos/storage enforce tenant+workspace on every write and query.

## 7. Deferred Capabilities (explicitly not in this milestone)

Live audio streaming; meeting-platform connectors (Zoom/Teams/Meet); Jira/Salesforce/HubSpot writes; Slack notifications; billing; autonomous action execution; vector search; knowledge graphs; video (any form); auth/RBAC (dev identity adapter only); calendar auto-capture; real-time UI streaming.

## 8. Future Extraction Boundaries

- `transcription` and `analysis` are isolated modules → can become separate services later without touching meetings/approvals/audit.
- Repository interfaces allow swapping D1 for another store (Postgres/Convex) without use-case changes.
- Storage interface allows swapping R2 for S3.
- When video returns (ADR 0002 §5), add `VIDEO` to `MediaType` behind `MEDIA_VIDEO_ENABLED`; reuse the same ingestion→transcription→analysis pipeline.
