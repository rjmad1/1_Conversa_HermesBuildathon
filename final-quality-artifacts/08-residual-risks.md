# Phase 08 - Residual Risks

This document registers all identified residual risks, limitations, and out-of-scope components in this release.

## 1. Architectural & Security Limitations
* **In-Memory Storage**: The application lacks a persistent database. Transcripts, meetings, action items, and audit logs are held in volatile memory. Restarting the server or a serverless function recycle will wipe all datasets.
* **Spoofable Scoping Headers**: Tenant/workspace isolation relies on request headers (`x-tenant-id`, `x-workspace-id`) without validation signatures, cryptographic tokens, or sessions.
* **Logger Concatenation Leakage**: The structured JSON logger redacts object keys recursively, but direct string concatenation (e.g. `logger.info(ctx, "User details: " + userSecret)`) will bypass redaction filters.
* **Mocked Integrations**: External integrations (Jira, Slack, Salesforce) are unimplemented, mocked, or planned only.

## 2. Release & QA Risks
* **Vercel 404 Mismatch**: The public deployment at `https://1-conversa-hermes-buildathon.vercel.app/` remains unreachable (returns 404), resulting in a source-to-deployment mismatch until the repository owner re-deploys.
* **Testing QA Waiver Risk**: Due to explicit instructions to skip QA activities, the final refactored codebase was not executed against the Vitest unit/integration/e2e test suites. While modifications (type-guards and de-duplication) were minimal and strictly typed, they have not been verified via test execution.
