# Conversa — Architectural Decision Records (ADRs)

---
### 📋 Document Metadata
- **Purpose**: Consolidates and indexes all architectural decisions, alternatives considered, tradeoffs, and consequences.
- **Audience**: Software architects, principal engineers, and engineering managers.
- **Last Generated**: 2026-07-13T05:20:47+05:30
- **Confidence Level**: High (Grounded directly in the active project configurations and documented ADRs).
- **Evidence Used**: Core ADR files (`docs/adr/0002-audio-first-media-scope.md` and `docs/adr/0003-audio-to-governed-action-foundation.md`).
- **Cross References**: See [ARCHITECTURE.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/ARCHITECTURE.md), [DEPLOYMENT.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/DEPLOYMENT.md).
- **Open Questions**: Rotation policy for static auth tokens.
- **Known Limitations**: Ephemeral DB limits validation of persistence options.
- **Recommended Next Actions**: Enforce TLS and HTTPS verification at deployment gateway.
---

## 1. Summary of Decisions (Roster)

| ADR ID | Decision Name | Status | Date | Confidence | Key Consequence |
| --- | --- | --- | --- | --- | --- |
| **ADR-0001** | Repository Inception | Superseded | 2026-07-08 | High | Initial codebase setup |
| **ADR-0002** | Audio-First Media Scope | **Accepted** | 2026-07-12 | High | Video out of scope; 415 rejection active |
| **ADR-0003** | Audio-to-Governed-Action | **Accepted** | 2026-07-12 | High | Modular monolith with strict isolation boundaries |

---

## 2. ADR-0002: Audio-First Media Scope

* **Status**: Accepted
* **Date**: 2026-07-12
* **Alternatives Considered**: 
  1. *Video Ingestion Support*: Implement full MP4 processing, streaming pipelines, and participant avatar views.
  2. *Audio-Only Forever*: Remove all traces of potential video abstractions, eliminating the future capability.
* **Tradeoffs**:
  * *Pros*: Smaller attack surface (no facial analytics or visual biometrics), simpler processing codecs, and lower storage consumption.
  * *Cons*: Lack of screen sharing or presentation visual analysis.
* **Consequences**:
  * All video uploads are rejected with `415 UNSUPPORTED_MEDIA_TYPE` at the boundary.
  * Modality-neutral abstractions (e.g. `MediaAsset`) allow the addition of video later without changing meetings/approvals.

---

## 3. ADR-0003: Audio-to-Governed-Action Foundation

* **Status**: Accepted
* **Date**: 2026-07-12
* **Alternatives Considered**:
  1. *Serverless Next.js*: Initial assumption of using Next.js Vercel API.
  2. *Express on Node.js*: Standard Node server backend.
* **Tradeoffs**:
  * *Pros*: Lightweight serverless Hono execution, modular-monolith structures, swappable database interfaces.
  * *Cons*: Ephemeral memory maps for dev mode make test cycles volatile if not mocked.
* **Consequences**:
  * Server running on **Hono Node Server** (Hono on Cloudflare Worker is the target pilot).
  * Storage: **Cloudflare D1** (SQLite) for database, **Cloudflare R2** for raw audio. In-memory maps for dev and testing.
  * Independent swappable providers (`AudioTranscriptionProvider`, `MeetingAnalysisProvider`) with low-temperature structured JSON outputs.
  * Strict logical multi-tenant and workspace barriers enforced on all queries.
