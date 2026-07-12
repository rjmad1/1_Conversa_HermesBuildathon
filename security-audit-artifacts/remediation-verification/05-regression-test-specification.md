# Regression Test Specification

This document defines executable security regression tests to prevent regressions of the audited multi-tenancy, provider integration, and logging vulnerabilities.

## Specification Register

### REG-SEC-001: Cross-Tenant Analysis Read Rejection
* **Layer**: Integration / E2E
* **Setup**: 
  1. Authenticate as Tenant A. Create a meeting and generate its transcript analysis.
  2. Authenticate as Tenant B. Attempt to retrieve the analysis using Tenant A's `meetingId`.
* **Assertion**: Request must fail.
* **Expected Error**: `404 Not Found` with `MEETING_NOT_FOUND` error code.
* **Criticality**: **CRITICAL**
* **Automation Recommendation**: API routing integration test checking Hono request response under different header contexts.

### REG-SEC-002: Cross-Workspace Analysis Read Rejection
* **Layer**: Integration
* **Setup**:
  1. Create a meeting under Tenant A, Workspace A and generate its analysis.
  2. Query the analysis under Tenant A, Workspace B context.
* **Assertion**: Request must fail.
* **Expected Error**: `404 Not Found` with `MEETING_NOT_FOUND` error code.
* **Criticality**: **HIGH**
* **Automation Recommendation**: Run in the integration test suite using mocked identity headers.

### REG-SEC-003: Action Approval Scope Rejection
* **Layer**: Integration
* **Setup**:
  1. Tenant A generates a proposed action with ID `action-1`.
  2. Tenant B attempts to call the `ApproveProposedAction` use case for `action-1`.
* **Assertion**: Call must fail; the action status must remain `PROPOSED` under Tenant A.
* **Expected Error**: `404 Not Found` with `NOT_FOUND` / "Action not found" error details.
* **Criticality**: **CRITICAL**
* **Automation Recommendation**: Usecase-level test asserting that matching tenant/workspace parameters are enforced on the action lookup.

### REG-SEC-004: Action Rejection Scope Rejection
* **Layer**: Integration
* **Setup**:
  1. Tenant A generates a proposed action with ID `action-1`.
  2. Tenant B attempts to call the `RejectProposedAction` use case for `action-1`.
* **Assertion**: Call must fail; action status remains unchanged and no `ApprovalDecision` record is stored.
* **Expected Error**: `404 Not Found` with `NOT_FOUND` / "Action not found" error details.
* **Criticality**: **CRITICAL**
* **Automation Recommendation**: Usecase-level test validating that action is not found.

### REG-SEC-005: Audit Retrieval Scope Rejection
* **Layer**: Integration / E2E
* **Setup**:
  1. Tenant A records audit events for a meeting.
  2. Tenant B requests audit logs for this meeting ID.
* **Assertion**: Request is rejected.
* **Expected Error**: `404 Not Found` / `MEETING_NOT_FOUND`.
* **Criticality**: **HIGH**
* **Automation Recommendation**: API endpoint route test using mismatched scopes.

### REG-SEC-006: Repository-level Scope Enforcement
* **Layer**: Unit
* **Setup**:
  1. Instantiate `InMemoryMeetingAnalysisRepo`.
  2. Save a `MeetingAnalysis` and a `ProposedAction`.
  3. Call `getByMeeting`, `getAction`, and `listActionsByMeeting` with mismatched `tenantId` or `workspaceId` parameters.
* **Assertion**: All queries must return `null` or empty array `[]`.
* **Expected Error**: Direct return value must be `null` or `[]`.
* **Criticality**: **HIGH**
* **Automation Recommendation**: Add dedicated repository tests in [in-memory.spec.ts](file:///c:/Users/rajaj/Projects/1_Conversa/tests/unit/in-memory.spec.ts) (to be created).

### REG-PROV-001: OpenAI Adapter Receives Bytes Rather Than Reference String
* **Layer**: Unit
* **Setup**:
  1. Mock OpenAI client library audio transcription endpoint.
  2. Call `OpenAITranscriptionProvider.transcribe` with a valid audio reference.
* **Assertion**: Verify the `file` object passed to the SDK is a valid `File` or `Blob` instance containing actual mock audio bytes, not a string path.
* **Expected Error**: None (call must succeed with proper mock payload).
* **Criticality**: **HIGH**
* **Automation Recommendation**: Use mock clients in Vitest to intercept API arguments and assert parameter types.

### REG-PROV-002: Storage Lookup Failure
* **Layer**: Integration
* **Setup**:
  1. Create database metadata for a file.
  2. Attempt to transcribe the audio without writing the bytes to the R2/storage bucket.
* **Assertion**: Usecase handles storage retrieval failure gracefully without crashing the thread.
* **Expected Error**: `502 Bad Gateway` / `TRANSCRIPTION_FAILED`.
* **Criticality**: **MEDIUM**
* **Automation Recommendation**: Mock `AudioStorage.get` to return `null` and assert usecase error code.

### REG-VAL-001: Unsupported Audio Object
* **Layer**: Integration / E2E
* **Setup**: Upload file with non-audio MIME types (e.g. `video/mp4` or `text/plain`).
* **Assertion**: Request is blocked at the upload boundary.
* **Expected Error**: `415 Unsupported Media Type` / `UNSUPPORTED_MEDIA_TYPE`.
* **Criticality**: **HIGH**
* **Automation Recommendation**: Run E2E test cases validating upload type enforcement.

### REG-LOG-001: Logger Execution without `process.stdout`
* **Layer**: Unit
* **Setup**:
  1. Set `globalThis.process` to `undefined` in the test runner thread.
  2. Execute `logger.info("Test message")`.
* **Assertion**: Logger falls back to portable outputs (e.g. `console.log`) without throwing runtime errors.
* **Expected Error**: None.
* **Criticality**: **MEDIUM**
* **Automation Recommendation**: Unit test that runs logger in a mock browser environment.

### REG-LOG-002: Sensitive-Field Deep Redaction
* **Layer**: Unit
* **Setup**:
  1. Call `logger.info({ nested: { api_key: "secret-key", transcript: "sensitive text" } })`.
* **Assertion**: The output JSON log must contain `"[redacted-secret]"` and `"[redacted-content]"` instead of raw values.
* **Expected Error**: None.
* **Criticality**: **MEDIUM**
* **Automation Recommendation**: Unit test covering the `redact()` function with multi-level nested test objects.
