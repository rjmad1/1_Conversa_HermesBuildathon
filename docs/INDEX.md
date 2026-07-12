# Conversa — Documentation Index (Single Source of Truth)

**Author role:** Technical Writer
**Purpose:** The canonical map of every Conversa document. If an agent is confused about scope, start here, then read in the order below. Do not implement from memory — implement from these docs.

## Reading Order for Builders (brutal priority)

1. `docs/adr/0002-audio-first-media-scope.md` — **the binding decision.** Audio-first; video out of scope; future extension strategy.
2. `docs/functional-audio-first.md` — agent-facing functional spec: input channels, formats, out-of-scope, user stories + ACs.
3. `docs/media-domain-model.md` — `MediaAsset` / `AudioAsset` / `MediaType` / `AudioFormat` / `AudioSource` / `TranscriptionJob` + minimum metadata.
4. `docs/api.md` — `POST /api/v1/meetings/:meetingId/audio`, processing flow, no camera/video.
5. `docs/media-validation.md` — ingestion rules + `UNSUPPORTED_MEDIA_TYPE` (415) contract.
6. `docs/architecture.md` — system shape, components, data flow, media integration.
7. `docs/ux-design.md` — audio-first UI flow, components, removed video elements, a11y.
8. `docs/deployment.md` — how to ship (Next.js + Cloudflare R2 + Convex); **open decision: Vercel vs Cloudflare**.
9. `docs/sre-ops.md` — monitoring, retention job, incident runbooks, DR, cost.
10. `docs/non-functional.md` — NFRs / SLOs.
11. `docs/transcription-analysis.md` — ingestion/transcription/analysis separation + provider interface.
12. `docs/test-plan.md` — audio-first test matrix (no mic/camera/external AI).
13. `docs/acceptance-criteria.md` — the 10 acceptance criteria.
14. `docs/cut-line.md` — **3-hour buildathon cut-line**: must-build / fake / defer. Start here on build day.
15. `docs/PRODUCTION_READINESS.md` — production readiness & security controls.

## Document Catalogue

| Document | Owner role | What it answers |
| --- | --- | --- |
| `docs/adr/0002-audio-first-media-scope.md` | Architecture Board | Why audio-first? What's excluded? How does video return later? |
| `docs/functional-audio-first.md` | Principal PM | What does the product do this release? ACs? |
| `docs/media-domain-model.md` | Data Architect | What are the media entities and their fields? |
| `docs/media-validation.md` | Security / Validation | How is audio validated? What error on video? |
| `docs/api.md` | API Owner | What endpoints exist? What's the flow? |
| `docs/architecture.md` | Enterprise Architect | How do the pieces fit? Data flow? |
| `docs/ux-design.md` | UX Director | What does the user see/do? What's removed? |
| `docs/deployment.md` | Platform / DevOps | Where does it run? How is audio stored? |
| `docs/sre-ops.md` | SRE / Ops | What do we watch? How do we recover? |
| `docs/non-functional.md` | Solution Architect | Latency/scale/security/compliance targets? |
| `docs/transcription-analysis.md` | AI Engineer | Where's the transcription boundary? Fake provider? |
| `docs/test-plan.md` | QA Lead | What must tests cover? No real mic/camera/AI? |
| `docs/acceptance-criteria.md` | QA / PM | Are we done? The 10 gates. |
| `docs/PRODUCTION_READINESS.md` | Security Engineer | What are the authentication, authorization, CORS, and rate limit rules in production? |
| `README.md` | Technical Writer | Human entry point; supported inputs; setup. |
| `IDEA.md` | Principal PM | Product vision (audio-first). |
| `Requirements/Requirements/*.md` | PM / Architecture | Original full requirements + buildathon context. |
| `.env.example` | DevOps | Audio config; `MEDIA_VIDEO_ENABLED=false`; no video vars. |

## Hard Rules (non-negotiable)

- No video capture/processing/playback/camera in this release.
- All media is tenant + workspace scoped.
- Raw audio never appears in logs.
- Transcription and analysis are separate modules.
- Video uploads return `415 UNSUPPORTED_MEDIA_TYPE`.
