# ADR 0002: Audio-First Media Scope

- **Status:** Accepted
- **Date:** 2026-07-12
- **Deciders:** Product Architecture Board, Security Architect, Principal Product Manager
- **Supersedes:** ADR 0001 (repository inception)

---

## 1. Decision

Conversa is an **audio-first** meeting intelligence platform. The current release
supports **audio** as the only media input modality. Video is explicitly **out of
scope** for this release and is documented (not implemented) as a future extension.

Supported input channels in this release:

1. **Audio upload** — user-uploaded audio files (MP3, WAV, M4A).
2. **Recorded audio** — audio captured or imported from meeting platforms.
3. **Future live audio stream** — real-time audio ingestion (designed for, not shipped this release).
4. **Pasted transcript** — plain-text transcript supplied directly by the user.
5. **Imported transcript** — transcript imported from a meeting platform or system of record.

The platform MUST NOT, in this release:

- Capture, upload, process, play back, analyze, or publish **video**.
- Request **camera** access or **webcam** permissions in any API or browser flow.
- Implement **avatar video**, **interactive video**, **video analytics**, or
  **video publishing**.

The media domain uses **modality-neutral abstractions** (`MediaAsset`, `MediaType`,
`AudioAsset`, `AudioFormat`, `AudioSource`, `TranscriptionJob`) so that a future
`VIDEO` media type can be added without redesigning the core meeting and media
domains. Only `MediaType.AUDIO` is active. A `VIDEO` enum value is **not** added in
this release; if a persistence model ever requires backward compatibility, any
stored `VIDEO` value MUST be rejected by application validation and feature
configuration.

---

## 2. Rationale

- **Scope focus.** The MVP and pilot value is "meetings → executed work" driven by
  **transcripts**, not video. Adding video capture/processing/playback would
  multiply engineering surface (codecs, streaming, storage, UI) with no change to
  the core outcome.
- **Privacy and compliance.** Audio-only capture has a smaller attack surface and
  simpler consent/retention story than video (no facial recognition, gesture, or
  screen-content analysis).
- **Buildathon and GTM fit.** The AI-as-Agency and meeting-intelligence tracks are
  audio/transcript centric; partners (Wispr Flow dictation, ElevenLabs voice output,
  OpenAI transcription) are audio-first.
- **Extension without rework.** Modality-neutral abstractions let video arrive later
  as a new `MediaType` behind the same ingestion → validation → persistence →
  transcription → analysis pipeline, isolating future rework.
- **Meeting platforms are audio/transcript sources.** Zoom, Teams, Google Meet, and
  phone bridges are *external meeting platforms* we integrate with. Their support for
  video does not make Conversa a video product; we consume their **meeting audio and
  transcripts**.

---

## 3. Consequences

### Positive

- Smaller, more testable surface; audio validation is simpler than video.
- Clearer compliance posture (no visual biometrics).
- Clean seam for future video via `MediaType` extension.
- Pasted/imported transcript path remains fully supported and unchanged.

### Negative / Trade-offs

- No visual context (screen shares, slide content, participant video) this release.
- Live audio streaming is designed-for but deferred; batch upload is the primary path.
- Customers expecting "interactive video" experiences must wait for a future release.

### Required follow-through

- All APIs accept only audio; video uploads return `UNSUPPORTED_MEDIA_TYPE`.
- No UI element requests camera; no video preview/player/thumbnail/timeline.
- Raw audio is excluded from logs; storage references are opaque and tenant-scoped.
- Transcription and meeting analysis remain separate modules.

---

## 4. Excluded Capabilities (this release)

The following are **explicitly out of scope** and MUST NOT be implemented:

- Video ingestion
- Video recording
- Camera access
- Video processing
- Visual analysis
- Facial recognition
- Gesture analysis
- Screen-content analysis
- Video playback
- Interactive video experiences
- Avatar video
- Video analytics
- Video publishing

---

## 5. Future Extension Strategy

Video is a **documented future capability**, not a hidden one. When reintroduced:

1. Add `VIDEO` to `MediaType` only after the persistence model is ready; gate it
   behind a feature flag (`media.video.enabled`) defaulting to `false`.
2. Introduce `VideoAsset` as a specialization parallel to `AudioAsset`, reusing
   `MediaAsset` base, `TranscriptionJob`, and the storage/security model.
3. Extend the ingestion API with a video-specific endpoint
   (`POST /api/v1/meetings/:meetingId/video`) that shares the same validation,
   persistence, and transcription pipeline; video-specific steps (e.g. audio
   extraction, frame analysis) are added as **optional** pipeline stages behind the
   `MediaType` switch.
4. Camera/webcam permissions, if ever needed, are requested only in an explicit
   opt-in flow surfaced behind the same feature flag, never in the default audio path.
5. Visual analysis (facial/gesture/screen) remains a separate, separately-governed
   module and is never coupled to the audio transcription pipeline.

This keeps the core meeting and media domains stable while allowing video to be
"bolted on" as a new modality rather than a rewrite.

---

## 7. Resolved Build Decisions (from buildathon planning)

These were open questions resolved before implementation; recorded so agents do not re-litigate them.

1. **Deployment = Cloudflare** (Workers + R2 + Pages + KV/D1). Not Vercel. Rationale: 60s Vercel cap vs 10MB Whisper latency; native R2 for audio; partner alignment. See `docs/deployment.md`.
2. **Tenant = fixed demo tenant** (`tenantId=demo`, `workspaceId=demo`), centralized in one config constant. Multi-tenancy deferred; extension path is header-based (`X-Tenant-Id`/`X-Workspace-Id`), inactive until auth. All records still carry tenant/workspace (never null). See `docs/architecture.md` §6.
3. **Paste-transcript requires user OpenAI key (BYOK).** "Works" = "works with key." No key → clear error, not silent failure. See `docs/functional-audio-first.md` US-2.

---

## 8. References

- `docs/media-domain-model.md` — normalized media domain and entity metadata.
- `docs/media-validation.md` — audio ingestion validation rules and error codes.
- `docs/api.md` — audio endpoint and processing flow.
- `docs/storage-security.md` — audio asset storage and security controls.
- `docs/transcription-analysis.md` — separation of transcription and analysis.
- `docs/test-plan.md` — audio-first test matrix.
- `docs/acceptance-criteria.md` — audio-first acceptance criteria.
