# Conversa — Audio-First Meeting Intelligence Platform

---
### 📋 Document Metadata
- **Purpose**: Canonical human-builder entry point, system summary, setup instructions, and documentation index.
- **Audience**: All stakeholders, engineers, architects, auditors, and AI assistants.
- **Last Generated**: 2026-07-13T05:20:47+05:30
- **Confidence Level**: High (Derived directly from current functional codebase and verified test outputs).
- **Evidence Used**: Core server (`src/app/index.ts`), packages, and passing test suites.
- **Cross References**: See `/docs` index directory below.
- **Open Questions**: Final decision on production database deployment (D1/SQLite vs. PostgreSQL).
- **Known Limitations**: ephemerality of in-memory data; no live audio recording in browser yet.
- **Recommended Next Actions**: Review the [PROJECT.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/PROJECT.md) for the business vision.
---

> **Current-state notice:** Conversa is an active Buildathon prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

Conversa turns meetings into completed work. It is an **audio-first** platform: it ingests meeting **audio** and **transcripts**, transcribes audio, and proposes governed, approval-gated actions. No video is captured, processed, or played back in this release.

> **Audio-first, not audio-only forever.** Video is a documented future extension (see [ADR 0002](file:///c:/Users/rajaj/Projects/1_Conversa/docs/adr/0002-audio-first-media-scope.md)) but is **not implemented** in this release.

---

## 📢 Public Release Disclosures

* **Security Status**: Remediation completed. Production identity adapter, role-based authorization, rate-limiting, and payload size controls are live and verified by security regression tests.
* **Authentication**: Enforces bearer tokens (`Authorization: Bearer <token>`) mapped server-side in production. Dev headers are disabled in production by default.
* **Persistence**: Core repositories and storage models are volatile and remain strictly in-memory. Administrative workspace reset endpoint is available for data cleanup.
* **Integrations**: External integrations (Slack, Jira, Salesforce, etc.) are planned for future milestones and are not live in this slice.
* **Transcription**: Live-provider verification of audio transcripts is for demonstration purposes only and is not equivalent to production compliance certification.
* **Demo Pathway**: The stable, tested path for the public demo uses a synthetic pasted transcript to avoid live audio upload limits.

---

## What Conversa Does (This Release)

* **Audio upload** (MP3, WAV, M4A), **recorded audio**, or **pasted/imported transcript**.
* Validates audio (MIME allowlist, size, duration, empty, extension/MIME, malformed, sanitized name, checksum).
* Persists audio securely with opaque, tenant/workspace-scoped storage references.
* Transcribes audio → transcript (provider behind `AudioTranscriptionProvider.transcribe()`).
* Normalizes transcript (diarization labels, optional redaction).
* Analyzes transcript with agents → proposes actions (owner, due date, system of record).
* Human approves or rejects proposed actions (human-in-the-loop).

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

The pasted/imported transcript path skips ingestion + transcription and enters at "transcript validation".

---

## Supported Inputs

| Channel | Status |
| --- | --- |
| Audio upload (MP3 / WAV / M4A) | Supported |
| Recorded audio | Supported (from meeting platforms) |
| Live audio stream | Future (designed for, not shipped) |
| Pasted transcript | Supported (Stable Demo Path) |
| Imported transcript | Supported |

### Supported Audio Formats
* **MP3** (`audio/mpeg`)
* **WAV** (`audio/wav`)
* **M4A** (`audio/mp4`)

---

## Technical Architecture

Conversa is built on a modern, lightweight runtime environment:
* **Backend**: Hono REST application running on Node.js.
* **Frontend**: Vite Single Page Application (SPA) with Vanilla JS and CSS.
* **Bundler & Build Tool**: Vite.
* **Testing**: Vitest for unit, integration, E2E, and adversarial testing.

---

## Setup & Usage (Buildathon Snapshot)

### Prerequisites
* Node.js (v18 or higher)
* npm

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm ci
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:5173`.

### Executing the Demo
1. Ensure the configured provider mode is available (`fake` for offline demo; `openai` requires server-side `OPENAI_API_KEY`).
2. Use the **Pasted Transcript** pathway.
3. Paste a synthetic meeting transcript.
4. Run analysis and review the proposed action items, decisions, and risks.
5. Approve or reject actions.

---

## Documentation Directory Index

Explore the comprehensive enterprise knowledge base:

### Project Vision & Requirements
* [PROJECT.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/PROJECT.md) — Business vision, stakeholder needs, goals, and success metrics.
* [REQUIREMENTS.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/REQUIREMENTS.md) — Functional and non-functional requirements catalog.
* [FEATURES.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/FEATURES.md) — Comprehensive breakdown of every feature, owner, and status.
* [ROADMAP.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/ROADMAP.md) — Maturity roadmap, technical priorities, and future phases.

### Architecture & Service Design
* [ARCHITECTURE.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/ARCHITECTURE.md) — Technical containers, sequence, and system data flows.
* [DECISIONS.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/DECISIONS.md) — Architectural Decision Records (ADRs) table and rationale.
* [SERVICES.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/SERVICES.md) — High-level services layout and interactions.
* [MODULES.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/MODULES.md) — Detailed code modules boundaries and interface descriptions.
* [API.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/API.md) — REST endpoints, payload examples, and error contracts.
* [DATABASE.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/DATABASE.md) — Relational mappings of in-memory data structures.
* [EVENTS.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/EVENTS.md) — Event-driven schemas, audit events, and handlers.

### Operations & Diagnostics
* [CURRENT_STATE.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/CURRENT_STATE.md) — Technical assessment scorecard and known debt.
* [DEPENDENCIES.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/DEPENDENCIES.md) — Package dependency registry, upgrades, and replacement candidates.
* [OBSERVABILITY.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/OBSERVABILITY.md) — Telemetry logging, error tracking, and metrics.
* [PERFORMANCE.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/PERFORMANCE.md) — Latency hotspots, caching design, and load analysis.
* [DEPLOYMENT.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/DEPLOYMENT.md) — CI/CD actions, hosting environments, and rollback procedures.
* [WORKFLOWS.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/WORKFLOWS.md) — Development lifecycle and incident runbooks.

### Security, AI Context, & Terminology
* [SECURITY.md](file:///c:/Users/rajaj/Projects/1_Conversa/SECURITY.md) — Threat models, RBAC scopes, encryption, and remediations.
* [AI_CONTEXT.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/AI_CONTEXT.md) — Persistent AI assistant memory guidelines and repo rules.
* [AGENTS.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/AGENTS.md) — AI multi-agent crew, orchestration sequences, and review logic.
* [PROMPTS.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/PROMPTS.md) — Reusable prompts for AI-driven engineering and QA.
* [KNOWN_ISSUES.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/KNOWN_ISSUES.md) — Current active bugs and temporary workarounds.
* [TROUBLESHOOTING.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/TROUBLESHOOTING.md) — Step-by-step resolution of common failures.
* [LESSONS_LEARNED.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/LESSONS_LEARNED.md) — Discovered anti-patterns and long-term insights.
* [ASSUMPTIONS.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/ASSUMPTIONS.md) — Verified and inferred project design assumptions.
* [TERMINOLOGY.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/TERMINOLOGY.md) — Domain vocabulary and glossary.
* [CODE_GUIDELINES.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/CODE_GUIDELINES.md) — Coding conventions and linter boundaries.
* [FOLDER_STRUCTURE.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/FOLDER_STRUCTURE.md) - Mapping of directories and boundaries.

---

## License

Conversa is distributed under the MIT License. See [LICENSE](LICENSE) for details.
