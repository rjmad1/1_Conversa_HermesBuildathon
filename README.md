# Conversa — Audio-First Meeting Intelligence Platform

> **Current-state notice:** Conversa is an active Buildathon prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

Conversa turns meetings into completed work. It is an **audio-first** platform: it ingests meeting **audio** and **transcripts**, transcribes audio, and uses AI agents to propose governed, approval-gated actions across your stack (Jira, Salesforce, HubSpot, code repos, internal tools). No video is captured, processed, or played back in this release.

> **Audio-first, not audio-only forever.** Video is a documented future extension (see `docs/adr/0002-audio-first-media-scope.md`) but is **not implemented** in this release.

---

## 📢 Public Release Disclosures

* **Security Status**: Security regression tests pass. Tenant isolation is closed and verified.
* **Authentication**: Production authentication is **not implemented**.
* **Identity Headers**: Caller-supplied development tenant and workspace headers (`x-tenant-id`, `x-workspace-id`) are not production credentials and can be spoofed.
* **Persistence**: Core repositories and storage models are volatile and remain strictly in-memory.
* **Integrations**: External integrations (Slack, Jira, Salesforce) remain partial, conceptual, or planned.
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
4. Open your browser to `http://localhost:5173` (or the port output by Vite).

### Executing the Demo

1. Enter your OpenAI API Key (BYOK model - keys are kept in memory and never stored server-side).
2. Use the **Pasted Transcript** pathway.
3. Paste a synthetic meeting transcript (e.g., standard dialog).
4. Run analysis and review the proposed action items, decisions, and risks.
5. Approve or reject actions.

---

## Documentation Index

> **Start at [docs/INDEX.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/INDEX.md)** — the single source of truth that maps every document and the reading order for builders.

* [docs/INDEX.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/INDEX.md) — Documentation index.
* [docs/CURRENT_STATE.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/CURRENT_STATE.md) — State of implementation.
* [docs/KNOWN_LIMITATIONS.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/KNOWN_LIMITATIONS.md) — Architectural and security limits.
* [docs/USER_GUIDE.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/USER_GUIDE.md) — End-user instructions.
* [docs/ADMIN_GUIDE.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/ADMIN_GUIDE.md) — Operations guide.
* [docs/TROUBLESHOOTING_GUIDE.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/TROUBLESHOOTING_GUIDE.md) — Fault resolution.
* [docs/FAQ.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/FAQ.md) — Frequently asked questions.
* [docs/IMPLEMENTATION_GUIDE.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/IMPLEMENTATION_GUIDE.md) — Source code walkthrough.
* [docs/USE_CASES.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/USE_CASES.md) — Business use cases.
* [docs/USER_STORIES.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/USER_STORIES.md) — User stories and acceptance status.

---

## License

Conversa is distributed under the MIT License. See [LICENSE](file:///c:/Users/rajaj/Projects/1_Conversa/LICENSE) for details.
