# Conversa — Architecture (Audio-First)

**Author role:** Enterprise Architect
**Status:** Accepted for MVP. See `docs/adr/0002-audio-first-media-scope.md`.

## 1. C4 Context (Level 1)

```text
[Users: PM, EM, Dev, Sales, CS, Exec, IT Admin]
        │  uses (audio upload / pasted transcript)
        ▼
┌──────────────────────────────────────────────────────────┐
│  CONVERSA PLATFORM (audio-first)                            │
│    Meeting Service │ Audio Ingestion │ Transcription │      │
│    Analysis (Agents) │ Memory │ Integration │ Governance    │
└──────────────────────────────────────────────────────────┘
        │                                  │
   integrates (audio/transcript sources)   │ transactional updates
        ▼                                  ▼
[Zoom/Teams/Google Meet/Phone]      [Jira/Salesforce/HubSpot/GitHub/Slack]
        │                                  │
   (these platforms MAY do video;         [LLM Providers: OpenAI/Wispr/Ollama]
    Conversa consumes only audio+transcript)
```

Meeting platforms are **external sources of audio and transcripts**, not Conversa video features.

## 2. Component Decomposition

| Service | Responsibility | Notes |
| --- | --- | --- |
| Meeting Service | Session/meeting metadata, policy. | Owns `meetingId`. |
| Audio Ingestion | Validate + persist audio → `AudioAsset`. | Enforces `docs/media-validation.md`. Rejects video (415). |
| Transcription | `AudioTranscriptionProvider.transcribe()` → `Transcript`. | Swappable; fake provider for tests. |
| Transcript Normalization | Diarization labels, optional redaction. | |
| Analysis (Agents) | Reason over validated transcript → proposed actions. | Consumes transcript, NOT raw audio. |
| Action Approval | Human approve/reject. | Human-in-the-loop. |
| Memory | Store transcripts/actions/outcomes. | Tenant-scoped. |
| Integration Fabric | Push approved actions to systems of record. | Idempotent. |
| Governance | RBAC, audit, retention. | |

## 3. Data Flow

```text
audio upload (MP3/WAV/M4A) OR pasted/imported transcript
   │
   ├─(audio)─▶ Audio Ingestion ──validate──▶ secure persist (AudioAsset, opaque ref)
   │                │
   │                ▼
   │            Transcription ──▶ Transcript
   │
   └─(paste)──▶ Transcript (skip ingestion+transcription)
                        │
                        ▼
                  Transcript Normalization
                        │
                        ▼
                     Analysis (agents) ──▶ proposed ActionItem[]
                        │
                        ▼
                   Action Approval (human) ──▶ Integration Fabric ──▶ Systems of Record
```

## 4. Media Domain Integration

`AudioAsset` specializes `MediaAsset` (see `docs/media-domain-model.md`). `MediaType.AUDIO`
is the only active value. `VIDEO` is reserved but rejected by validation + feature flag.

## 5. Key Decisions (binding)

- Modality-neutral base (`MediaAsset`) so video can be added later without rework.
- No business logic in route handlers or UI.
- Ingestion, transcription, analysis are separate modules (no merging).
- Object storage holds raw audio; relational/doc record holds metadata + `storageReference` only.

## 6. Open Items (resolved during build)

- **Deployment target — RESOLVED:** **Cloudflare is primary.** See `docs/deployment.md` decision record (Workers + R2 + Pages + KV). Rationale: longer CPU/function limits than Vercel's 60s cap (needed for 10MB Whisper), integrated R2 object storage for audio, partner alignment.
- **Tenant resolution — RESOLVED:** MVP uses a **single fixed demo tenant** (`tenantId = demo`, `workspaceId = demo`), centralized in one config constant. Multi-tenancy is deferred; the **extension path is header-based** — `X-Tenant-Id` / `X-Workspace-Id` request headers, validated and scoped once auth lands. All `AudioAsset` / `Transcript` / `ActionItem` records are still written with `tenantId`/`workspaceId` (never null), satisfying the "all data tenant-scoped" constraint even in single-tenant MVP. Do not branch logic on "is demo" elsewhere — treat demo as a normal tenant.
