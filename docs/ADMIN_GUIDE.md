# Conversa Admin Guide

> **Current-state notice:** Conversa is an active MVP prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

This guide provides configurations, environment policies, and security operations details for administrators deploying this Conversa snapshot.

---

## 1. Runtime and Framework
* **Engine**: Node.js (v18+)
* **REST Service Router**: Hono v4
* **Bundler & Client server**: Vite v6
* **Language**: TypeScript (v5+)

## 2. Environment Variables
To run Conversa, you can use the following environment variables (defined in `.env` or set in Vercel):

* `PORT`: Port for the API server (default: `5173`).
* `OPENAI_API_KEY`: API key for transcription and analysis (optional, defaults to client-supplied BYOK).
* `AUDIO_MAX_BYTES`: Size limit for audio uploads (default: `10485760` / 10MB).
* `AUDIO_MAX_SECONDS`: Duration limit for audio uploads (default: `7200` / 2 hours).
* `AUDIO_ALLOWED_MIME_TYPES`: Comma-separated list of MIME types (default: `audio/mpeg,audio/wav,audio/mp4`).

## 3. Development Identity
Conversa does NOT implement a production authentication system in this snapshot. Scoping relies on:
* `x-tenant-id` request header.
* `x-workspace-id` request header.

> [!WARNING]
> **Identity Warning**: Caller-supplied development tenant and workspace headers are not production authentication. They can be easily spoofed and must not be used in production without wrapping them in a secure authentication proxy (e.g. JWT validation).

## 4. Tenant/Workspace Model
Every repository operation checks and scopes data based on the extracted tenant and workspace. The memory context is managed within `src/infrastructure/repositories/in-memory.ts` and enforces logical partition boundaries.

## 5. AI Provider Configuration
* **Transcription**: Managed via `AudioTranscriptionProvider` which wraps the OpenAI API Whisper endpoint.
* **Meeting Analysis**: Managed via the OpenAI ChatCompletion adapter.

## 6. Storage Configuration
All meeting audio files are stored in memory via byte-buffer maps during processing and are immediately discarded after analysis. No persistent object storage (e.g., S3, Cloudflare R2) is configured in this release.

## 7. Logger Configuration & Redaction Policy
Conversa uses a dedicated `ConsoleLogger` class that implements a recursive redaction policy:
* **Redaction Sink**: Any logging output undergoes recursive key scanning.
* **Recursion Limit**: Payload logs are scanned to a maximum depth of 10.
* **Redacted Fields**: Keys containing `key`, `token`, `secret`, `authorization`, `password`, or `audio` have their values replaced with `[REDACTED]`.

## 8. Test Fixtures
Test fixtures reside under `tests/unit/fixtures` and `quality-artifacts/audio-governed-action/fixtures/`. Synthetic wav/mp3 and transcript fixtures are used to test ingestion.

## 9. Vercel Configuration
The Vercel deployment uses the default Vite configuration. The project builds the frontend using `vite build` and deploys Hono server handlers as serverless routes.

## 10. In-Memory Persistence Behavior
All repositories (Meetings, Actions, Audits) use in-memory Maps. Data does not survive server restarts, serverless function cold starts, or container terminations.

## 11. Production Hardening Backlog
Before moving out of experimental classification, the following changes must be made:
* Implement cryptographic signature verification on session/tenant headers (e.g. Auth0, JWT).
* Replace in-memory Maps with a production SQL/NoSQL database (e.g. PostgreSQL, SQLite, D1).
* Configure permanent object storage (R2/S3) with presigned GET/PUT URLs.
* Implement rate limiting on all Hono API endpoints.

## 12. Backup and Recovery Limitations
Since all data is in memory, there is no backup or recovery mechanism in this snapshot. Disaster recovery is limited to redeploying the container or restarting the service.

## 13. Deployment Diagnostics
* **Endpoint check**: Call `GET /api/health` to verify service availability.
* **Audit extraction**: Query `GET /api/v1/audits` with tenant and workspace headers to retrieve runtime logs for debugging.
