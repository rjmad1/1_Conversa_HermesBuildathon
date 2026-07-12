# Repository Observations

This document records the read-only assessment of the Conversa repository prior to the implementation of the Audio-to-Governed-Action milestone.

## 1. Observed Facts

### Detected Frameworks & Versions
* **Runtime Platform / Dependency**: Node.js environment, using TypeScript (`"typescript": "^5.7.2"`), ES Modules (`"type": "module"`), and Vite (`"vite": "^6.0.0"`).
* **API Framework**: Hono (`"hono": "^4.6.0"`) is listed as a dependency in [package.json](file:///c:/Users/rajaj/Projects/1_Conversa/package.json).
* **Validation**: Zod (`"zod": "^3.23.8"`) is used for schema definitions and runtime parsing.
* **OpenAI Client**: OpenAI SDK (`"openai": "^4.67.0"`) is present in dependencies.
* **Test Runner**: Vitest (`"vitest": "^2.1.8"`) is used for testing.

### Persistence Technology
* In-memory repository abstractions are implemented under [in-memory.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/repositories/in-memory.ts). These include:
  * `InMemoryMeetingRepo`
  * `InMemoryAudioAssetRepo`
  * `InMemoryTranscriptRepo`
  * `InMemoryAnalysisRunRepo`
  * `InMemoryMeetingAnalysisRepo`
  * `InMemoryAuditRepo`
* In-memory blob storage is implemented under [in-memory.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/storage/in-memory.ts).
* No physical databases (e.g. SQLite, D1, PostgreSQL) or cloud storage adapters (e.g. S3, Cloudflare R2) are instantiated in the active code.

### Test Framework & Commands
* Tests are managed via Vitest configuration in [vitest.config.ts](file:///c:/Users/rajaj/Projects/1_Conversa/vitest.config.ts).
* The following test and verification scripts are configured in [package.json](file:///c:/Users/rajaj/Projects/1_Conversa/package.json):
  * `npm run lint` — `eslint . --max-warnings=0`
  * `npm run typecheck` — `tsc --noEmit`
  * `npm run test` — `vitest run --project unit`
  * `npm run test:integration` — `vitest run --project integration`
  * `npm run test:e2e` — `vitest run --project e2e`
  * `npm run build` — `tsc --noEmit && vite build`

### Current Route Conventions
* While Hono is in the dependencies, no HTTP server entrypoint, routes, or controllers are defined in the source code yet.
* Current API routing conventions are specified in [api.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/api.md) and [test-plan.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/test-plan.md):
  * `POST /api/v1/meetings`
  * `GET  /api/v1/meetings/:meetingId`
  * `POST /api/v1/meetings/:meetingId/audio`
  * `POST /api/v1/meetings/:meetingId/transcript`
  * `POST /api/v1/meetings/:meetingId/transcription`
  * `POST /api/v1/meetings/:meetingId/analysis`
  * `GET  /api/v1/meetings/:meetingId/analysis`
  * `POST /api/v1/actions/:actionId/approve`
  * `POST /api/v1/actions/:actionId/reject`
  * `GET  /api/v1/meetings/:meetingId/audit`
  * `GET  /api/health/live`
  * `GET  /api/health/ready`

### Current Domain Terminology
* **Meeting Statuses**: `DRAFT`, `READY`, `PROCESSING`, `REVIEW_REQUIRED`, `COMPLETED`, `FAILED` (defined in [schemas.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/shared/validation/schemas.ts)).
* **Media Asset Specialization**: `MediaAsset` is specialized as `AudioAsset`, categorized by `AudioFormat` (`MP3`, `WAV`, `M4A`) and `AudioSource` (`UPLOAD`, `RECORDED`, `LIVE_STREAM`, `TRANSCRIPT_PASTE`, `TRANSCRIPT_IMPORT`).
* **Audit Event**: Scoped by `tenantId` and `workspaceId` containing `meetingId`, `entityType`, `entityId`, `eventType`, `actorType`, `actorId`, `correlationId`, `metadata`, and `createdAt`.

### Existing Security Controls
* **Sanitization**: [media.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/shared/validation/media.ts) contains `sanitizeFilename` (strips control characters, spaces, and path separators) and `isExtensionMimeConsistent` to prevent extension spoofing.
* **Integrity**: `checksumOf` (SHA-256) is generated and stored for uploaded audio files to verify contents.
* **Log Redaction**: [redaction.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/shared/security/redaction.ts) automatically redacts secrets and content-bearing parameters (e.g. raw audio, transcripts, local paths, API keys) using regex patterns `SENSITIVE_KEYS` and `BODY_KEYS`.
* **Identity Context**: [identity.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/shared/security/identity.ts) contains `DevIdentityAdapter` to resolve `tenantId`, `workspaceId`, `actorId`, and `actorType` from headers (`x-tenant-id`, `x-workspace-id`, `x-actor-id`).

### Existing Observability Controls
* **Logging**: A custom structured JSON logger is set up in [logger.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/shared/logging/logger.ts) which wraps the `redact` logic.
* **Health Checks**: Liveness and readiness helpers are written in [health.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/shared/observability/health.ts).

---

## 2. Inferred Expectations

* **Cloudflare Workers Deployment**: Given that Cloudflare R2 and D1 are targeted, the application is expected to run within the Cloudflare Workers v8 isolate environment.
* **Header-Based Multi-Tenancy**: The identity adapter parses `x-tenant-id` and `x-workspace-id` headers, implying that the API routing layer will propagate incoming HTTP headers into the `IdentityAdapter` context to enforce tenant isolation.
* **BYOK Support**: Pasted transcripts or audio processing in certain contexts are expected to support an optional `apiKey` in request payloads, allowing the user to provide their own OpenAI key without storing it on the server.

---

## 3. Assumptions

* **Node.js Compatibility**: The repository uses `node:crypto` (`randomUUID` and `createHash`). It is assumed that the Cloudflare Workers compatibility flag `nodejs_compat` will be enabled in production config to support these Node modules.
* **Provider Behavior**: The fake transcription and analysis providers ([fake-transcription.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/providers/fake-transcription.ts) and [fake-analysis.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/providers/fake-analysis.ts)) are assumed to be loaded dynamically or selected via `TRANSCRIPTION_PROVIDER=fake` / `ANALYSIS_PROVIDER=fake` settings in tests/CI.
* **No Client Video Capabilities**: It is assumed that the UI will enforce a complete lack of camera or microphone stream requests in the browser, using solely file uploads and textbox pasting.

---

## 4. Unresolved Questions

* **Routing Setup**: How Hono will be booted and how the middlewares (specifically for injection checks and CORS) will hook into the dependency injection container.
* **Unit of Work**: How transactional boundaries (atomic commits across meeting metadata, audio assets, transcripts, and audit logs) will be preserved in a serverless environment when using D1 and R2 together.
* **Persistence Scoping Gap**: The domain schema for `ProposedAction` in [schemas.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/shared/validation/schemas.ts) does not inherit from `TenantScopeSchema`. This means `ProposedAction` objects do not have direct `tenantId` or `workspaceId` fields, relying solely on `meetingId` relations. This might introduce a tenant isolation bypass risk if not validated correctly at the application or repository layer.
