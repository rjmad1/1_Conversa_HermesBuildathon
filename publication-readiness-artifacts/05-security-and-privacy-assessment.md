# Phase 4 - Security and Privacy Assessment

This document assesses the confidentiality, credentials safety, and tenancy isolation boundaries in the Conversa codebase.

## 1. Secret Scan Findings

A thorough recursive search of all tracked and untracked repository folders was performed to locate hardcoded tokens, passwords, keys, or private URLs.

* **OpenAI Credentials**: None found. Environment template `.env.example` specifies that the OpenAI API key is optional and should be loaded via `OPENAI_API_KEY` at runtime.
* **Database Credentials**: None found. Local persistence is in-memory only.
* **OAuth Secrets / Webhooks**: None found.
* **Other API Tokens**: None found.
* **Raw Meeting Audio / Transcripts**: No real user/client meetings or recordings are stored in the codebase. All test fixtures (`SAMPLE_MP3`) are synthetic data.

## 2. Multi-Tenancy Isolation Evaluation

Multi-tenancy isolation is enforced at the repository and query boundary layer. We analyzed the enforcement logic across modules:

1. **Get and Save Scoping**:
   - Every read operation (e.g. `repos.meeting.get`, `repos.transcript.findByMeeting`) takes the caller's verified `tenantId` and `workspaceId` and matches them against the records.
   - If there is a scope mismatch (e.g., Tenant B attempts to read Tenant A's meeting or analysis), the query returns `null` or throws a non-disclosing 404 `MEETING_NOT_FOUND` / `NOT_FOUND` error.
2. **Action Governance Boundary**:
   - The approvals module (`ApproveProposedAction` / `RejectProposedAction`) resolves the proposed action and verifies that the parent meeting belongs to the actor's tenant/workspace. Failed attempts result in a 404 error without executing mutations.
3. **Audit Scoping**:
   - Meeting audit history retrieval validates meeting ownership. Cross-tenant queries are blocked with a `MEETING_NOT_FOUND` exception before reaching the audit logs.

## 3. Residual Security and Privacy Risks

* **Spoofable Headers (Broken Authentication)**: The `DevIdentityAdapter` extracts identity details (`x-tenant-id`, `x-workspace-id`) directly from HTTP headers without token verify or signatures. While appropriate for a Buildathon prototype, this is a critical risk if exposed directly to production without a proxy or API gateway validating JWT signatures.
* **In-Memory Storage Ephemerality**: Since the data store is an in-memory Map, any server crash, restart, or scale-down event in serverless environments (like Vercel functions sleeping) will wipe out all tenant records, analyses, and audit logs.
* **OpenAI Data Logging**: If `openai` is enabled as the provider, raw meeting transcripts and audio files are sent to OpenAI's endpoints. There is no client-side option to opt-out of AI model training or data logging at the application layer.
* **Logger Redaction Escape Hatches**: While the `redact` utility deeply redacts sensitive keys (up to depth 10) in logs, any raw variables formatted into log *message* strings (e.g. `logger.info(..., "User typed: " + secret)`) will bypass the JSON key matcher and leak into logs.
