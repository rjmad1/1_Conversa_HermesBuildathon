# Hermes Completion Review Checklist

This checklist is used to audit the implementation deliverables and the completion report submitted by the parallel implementing agent (Hermes).

---

## 1. Execution & Delivery Integrity
- [ ] **Unexecuted Commands Verification**: Verify that every command reported as passed (e.g. `npm run test`, `npm run lint`) was actually executed in the environment. Cross-check shell execution history and CI job logs; verify that results are not faked or spoofed.
- [ ] **Missing Files Check**: Cross-reference the final repository tree against the requested project structure. Confirm all module files in the plan exist and contain active code (no empty stubs).

## 2. Domain & Architecture Layout
- [ ] **Duplicate Domain Models**: Ensure there are no duplicate or parallel media/audio domain models. Specializations like `AudioAsset` must inherit from the shared `MediaAsset` base (Clean Architecture) instead of creating isolated types.
- [ ] **Provider Leakage into Domain**: Verify that no provider-specific imports, SDKs (e.g., OpenAI classes, Axios, got), or raw provider response formats leak into domain models or core application logic. Downstream layers must communicate through defined interfaces and mapping models.
- [ ] **Fake Providers availability in CI**: Ensure that the deterministic fake providers (`FakeTranscriptionProvider`, `FakeAnalysisProvider`) are fully functional and default in the test environment. There must be no requirements for external network calls or keys to pass CI test runs.

## 3. UI & API Logic Boundaries
- [ ] **Route-Handler Business Logic**: Verify that no business logic (validation, database reads/writes, orchestration) resides directly in HTTP route handlers. Handlers must strictly delegate request parsing and response mapping to application services.
- [ ] **UI Business Logic**: Confirm that the UI views contain zero business logic. State transitions, transcription workflows, and action approvals must be processed at the API tier; the browser remains a presentation layer.

## 4. Security & Isolation
- [ ] **Browser API-Key Exposure**: Verify that no browser flows request, store, or transmit persistent AI API keys.Ephemereal BYOK keys for the pasted path must remain in memory during the request and never be saved to database or local storage.
- [ ] **Video Remnants**: Verify that no video capture, processing, camera permission prompts, or video players were implemented. Ensure `MEDIA_VIDEO_ENABLED=false` is set in configuration.
- [ ] **Missing Tenant Scoping**: Verify that all database reads, writes, and lookups explicitly scope queries with `tenantId` and `workspaceId` resolved from authenticated identity headers. Ensure actions retrieve parent meetings to validate tenant ownership before returning details.

## 5. Audit & State Integrity
- [ ] **Mutable Audit Records**: Confirm that the database or repository layer enforces append-only constraints on the audit trail table. Attempting to update or delete any record in `AuditRepo` must throw an error.
- [ ] **Fabricated Owners or Dates**: Audit the analysis outputs. Verify that the LLM parser maps unknown owners or dates to `null` instead of fabricating random fake names or default dates.
- [ ] **Absent Source Evidence**: Verify that all extracted action items and decisions include a non-empty `sourceEvidence` snippet containing verbatim text from the transcript content.
- [ ] **Unsafe Logs**: Audit the logging configuration. Verify that stdout logs contain absolutely no plain text raw transcripts, files contents, credentials, or local path strings.

## 6. Resilience & Monitoring
- [ ] **Coupled Liveness/Readiness Checks**: Confirm that `/api/health/live` is isolated and does not execute downstream database queries or provider API checks. The liveness probe must only verify process reachability.
- [ ] **Missing Idempotency**: Verify that duplicate uploads (same checksum and meeting) do not rewrite files to R2, and duplicate analysis requests return cached outputs based on the transcript's idempotency key.

## 7. Technical Debt
- [ ] **Undocumented Technical Debt**: Scan the codebase for any `TODO`, `FIXME`, or temporary workaround comments. If any retention job or integration features were deferred, verify they are explicitly noted with a `ponytail:` description tracking limits and upgrade paths.
