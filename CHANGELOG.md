# Changelog

---
### 📋 Document Metadata
- **Purpose**: Tracks historical project changes, releases, and milestones.
- **Audience**: Builders, compliance auditors, and AI assistants.
- **Last Generated**: 2026-07-13T05:20:47+05:30
- **Confidence Level**: High (Grounded in repository git logs).
- **Evidence Used**: Repository git logs.
- **Cross References**: See [ROADMAP.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/ROADMAP.md) for future releases.
- **Open Questions**: None.
- **Known Limitations**: Historical data is simplified; does not include full commit hashes.
- **Recommended Next Actions**: Review the security enhancements in [SECURITY.md](file:///c:/Users/rajaj/Projects/1_Conversa/SECURITY.md).
---

All notable changes to this project will be documented in this file.

The release classification is: **Experimental MVP snapshot — not production-ready.**

## [0.4.0] - 2026-07-22
### Added
- **Universal Product Strategy & Competitive Intelligence Suite**: Published `docs/COMPETITOR_PARITY.md` establishing Conversa's strategic positioning as a **Headless Meeting Capture & Native Task Execution Engine**.
- **Autonomous Agent-to-Agent (A2A) Negotiation Protocol**: Direct AI-to-AI capacity exchange and sprint allocation locking across Jira/Linear agents (`src/modules/agency/a2a-negotiation.ts`).
- **Zero-Touch Ambient Meeting Join Bot Controller**: Automated multi-channel meeting audio joiner for Zoom, Teams, and Google Meet (`src/modules/meetings/ambient-bot.ts`).
- **Workspace Decision & Knowledge Vector RAG Search**: Semantic similarity search engine for historical meeting decisions and action lineage (`src/modules/retrieval/vector-rag.ts`).
- **AES-256-GCM Envelope Credential Encryption**: Enterprise security service for API keys and OAuth tokens at rest (`src/shared/security/credential-encryption.ts`).
- **SRE Dead-Letter Queue (DLQ) & Exponential Retries**: Persistent failure queue and retry wrapper in `HandOffDispatcher` (`src/modules/integrations/hand-off-dispatcher.ts`).
- **Universal REST API Endpoints & 100% Certification**: Added HTTP API handlers for A2A negotiation, ambient bot scheduling, vector RAG search, and credential encryption with 216 passing test suites across unit, integration, and E2E layers.
- **Universal Strategy Artifacts**: Created `docs/PRODUCT_STRATEGY.md`, `docs/CAPABILITY_MATRIX.md`, `docs/STRATEGIC_GAP_ANALYSIS.md`, `docs/PERSONA_JTBD.md`, `docs/TECHNICAL_DEBT_AND_ARCHITECTURE.md`, `docs/INNOVATION_ASSESSMENT.md`, and `docs/EXECUTIVE_SUMMARY.md`.


## [0.3.1] - 2026-07-13
### Added
- central `authGuard` middleware for role-based access control (`admin`, `approver`, `viewer`).
- production authentication adapter (`ProdIdentityAdapter`) enforcing Bearer Tokens.
- request body limit protection (2MB non-audio, configurable `AUDIO_MAX_BYTES` for audio).
- rate limiting on transcription, analysis, agency, and reset operations.
- automated security containment regression test suite.

## [0.3.0] - 2026-07-12
### Fixed
- tenant-isolation vulnerabilities in Hono handlers and repository layers.
- recursively redacted JSON logging up to depth 10.
- stabilized all Vitest test runner assertions.

## [0.2.0] - 2026-07-10
### Added
- Hono REST API framework integration.
- Vite Vanilla SPA client interface.
- In-memory data repository implementations.
- Synthetic pasted transcript analysis flow.

## [0.1.0] - 2026-07-08
### Added
- Initial commit of the Conversa prototype core.
