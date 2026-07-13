# Conversa — Inferred & Verified System Assumptions

---
### 📋 Document Metadata
- **Purpose**: Catalogs all inferred and verified project assumptions, their confidence levels, evidence, and verification status.
- **Audience**: Business analysts, QA engineers, and software architects.
- **Last Generated**: 2026-07-13T05:20:47+05:30
- **Confidence Level**: High (Directly verified by repository audits and test configurations).
- **Evidence Used**: Core database structures, identity adapter code, and Vitest test scenarios.
- **Cross References**: See [PROJECT.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/PROJECT.md), [REQUIREMENTS.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/REQUIREMENTS.md), [KNOWN_ISSUES.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/KNOWN_ISSUES.md).
- **Open Questions**: Rotation policy for static Bearer tokens.
- **Known Limitations**: Ephemeral DB limits validation of persistence options.
- **Recommended Next Actions**: Enforce TLS and HTTPS verification at deployment gateway.
---

## 1. Assumptions Registry

### 1.1 Multi-Tenancy Resolution Scopes
* **Assumption**: In production, all callers are locked to a single, server-configured demo workspace.
* **Confidence Level**: High
* **Evidence**: `ProdIdentityAdapter.resolve` forces tenancy mapping to `cfg.DEMO_TENANT_ID` and `cfg.DEMO_WORKSPACE_ID` directly.
* **Verification Status**: Verified by security regression tests.

### 1.2 Audio file size allocation limits
* **Assumption**: A 10MB upload threshold is sufficient for compressed meeting audio recordings (e.g. up to 30 mins MP3).
* **Confidence Level**: Medium
* **Evidence**: `envSchema` default value `AUDIO_MAX_BYTES: 10485760` (10MB).
* **Verification Status**: Verified by request body limit tests.

### 1.3 LLM Availability & Timeout
* **Assumption**: External OpenAI endpoint latency stays under the Hono client execution window (default timeout 55s).
* **Confidence Level**: High
* **Evidence**: `PROVIDER_TIMEOUT_MS: 55000` is defined in `env.ts`.
* **Verification Status**: Verified by integration tests.

### 1.4 Diarization tags formatting
* **Assumption**: External transcription providers parse speakers correctly, supplying diarization tags like "Speaker 1" and "Speaker 2".
* **Confidence Level**: Medium
* **Evidence**: Specialist extraction loop processes speaker tags inside `cases.ts`.
* **Verification Status**: Inferred.
