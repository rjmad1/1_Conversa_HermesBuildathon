# Conversa — AI Context & Persistent Memory

---
### 📋 Document Metadata
- **Purpose**: Persistent AI memory specifying system constraints, code patterns, and repository conventions for AI coding assistants.
- **Audience**: AI coding assistants, developer agents, and platform engineers.
- **Last Generated**: 2026-07-13T05:20:47+05:30
- **Confidence Level**: High (Directly verified by repository rules and architectural bounds).
- **Evidence Used**: Root files, linter config, and project constraints.
- **Cross References**: See [CODE_GUIDELINES.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/CODE_GUIDELINES.md), [ARCHITECTURE.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/ARCHITECTURE.md).
- **Open Questions**: Rotation guidelines for static tokens.
- **Known Limitations**: Ephemeral DB locks limit developer validation cycles.
- **Recommended Next Actions**: Enforce TLS and HTTPS verification at deployment gateway.
---

## 1. Things the AI Should Always Remember

> [!IMPORTANT]
> **Audio-First Scope Boundary**: Conversa is strictly **audio-first** in this release. Any attempt to introduce video ingestion, recording, avatar previews, or visual analysis is a violation of core project constraints. Any video upload MUST return `415 UNSUPPORTED_MEDIA_TYPE` (or 400).

* **Tenancy Isolation**: Multi-tenancy is active and logical. Every database query and write MUST enforce tenant and workspace checks.
* **No Raw Audio in Logs**: Raw audio payloads are completely excluded from log sinks.
* **Recursive Redaction**: Log payloads undergo JSON redaction up to depth 10 to filter out sensitive credentials or API keys.
* **Hono Dependency decoupling**: Keep business domain models and use cases independent of Hono routing libraries. Route handlers should act as thin wrappers around use cases.

---

## 2. Preferred Code Patterns & Architecture

* **Type Safety**: Enforce strict typing. Avoid `any` types. Define explicit interfaces for domain boundaries.
* **Error Handling**: Throw `AppError` with structured ErrorCodes (`ErrorCode.VALIDATION_ERROR`, `ErrorCode.NOT_FOUND`, etc.).
* **Testing**: Write unit tests for business validation logic, and integration tests for route boundaries and tenant isolations.

---

## 3. Technology Decisions
* **Runtime**: Node Server served via Hono.
* **Orchestration**: Sequential specialist coordination with automatic revision loops and hard limits (max 1 retry) to prevent credit exhaustion.
* **Persistence**: Currently volatile in-memory Map repositories. Horizon 1 targets migration to Convex or Cloudflare D1/R2.
