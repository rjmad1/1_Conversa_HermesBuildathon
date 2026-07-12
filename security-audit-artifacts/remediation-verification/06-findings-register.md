# Security Findings Register

This register details all unresolved security findings identified during the independent remediation verification audit of the Conversa codebase.

## Finding Details

### AUDIT-001: Cross-Tenant Meeting Analysis Read Leak
* **Finding ID**: `AUDIT-001`
* **Title**: Cross-Tenant Meeting Analysis Read Leak
* **Severity**: <span style="color:red">**CRITICAL**</span> (Release Blocker)
* **Affected Component**: `InMemoryMeetingAnalysisRepo.getByMeeting` and `GetMeetingAnalysis` usecase.
* **Evidence**: 
  * In [in-memory.ts:L100-102](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/repositories/in-memory.ts#L100-L102), `getByMeeting` ignores the `tenantId` and `workspaceId` parameters.
  * Standalone runner script Scenario T2 returned HTTP 200 containing other tenants' confidential analysis results.
* **Exploit or Failure Path**: An authenticated attacker under `Tenant B` calls `GET /api/v1/meetings/<Tenant_A_Meeting_UUID>/analysis`. The endpoint resolves identity correctly but passes parameters to `getByMeeting` which ignores them, returning Tenant A's private meeting analysis data.
* **Tenant Impact**: Direct leakage of confidential meeting outcomes.
* **Confidentiality Impact**: **HIGH** (exposes meeting summaries, decisions, risks, and proposed action descriptions).
* **Integrity Impact**: **NONE**
* **Availability Impact**: **NONE**
* **Remediation Status**: **UNREMEDIATED**
* **Retest Requirement**: `getByMeeting` must perform verification. Adversarial test `ADV-T2` must reject with `404 Not Found`.
* **Release Consequence**: **BLOCKS RELEASE**

---

### AUDIT-002: Cross-Tenant Proposed Action Mutability
* **Finding ID**: `AUDIT-002`
* **Title**: Cross-Tenant Proposed Action Mutability
* **Severity**: <span style="color:red">**CRITICAL**</span> (Release Blocker)
* **Affected Component**: `InMemoryMeetingAnalysisRepo.getAction` and `ApproveProposedAction`/`RejectProposedAction` usecases.
* **Evidence**:
  * In [in-memory.ts:L112-115](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/repositories/in-memory.ts#L112-L115), `getAction` ignores tenant/workspace parameters.
  * Adversarial runner Scenario T3 successfully approved a proposed action belonging to a different tenant.
* **Exploit or Failure Path**: An attacker authenticated as `Tenant B` issues `POST /api/v1/actions/<Tenant_A_Action_UUID>/approve`. The application loads the action regardless of tenant scope, mutates its status to `APPROVED`, and logs a success audit trace.
* **Tenant Impact**: Cross-tenant state modification and data corruption.
* **Confidentiality Impact**: **MEDIUM** (metadata leakage during transition).
* **Integrity Impact**: **HIGH** (malicious actors can approve/reject items across tenant bounds).
* **Availability Impact**: **NONE**
* **Remediation Status**: **UNREMEDIATED**
* **Retest Requirement**: Ensure action retrieval enforces matching scopes. Scenarios `ADV-T3` and `ADV-T4` must fail with `404 Not Found`.
* **Release Consequence**: **BLOCKS RELEASE**

---

### AUDIT-003: Inoperable OpenAI Transcription Adapter
* **Finding ID**: `AUDIT-003`
* **Title**: Inoperable OpenAI Transcription Adapter
* **Severity**: <span style="color:red">**HIGH**</span> (Release Blocker)
* **Affected Component**: `OpenAITranscriptionProvider.transcribe`
* **Evidence**: 
  * In [openai.ts:L33-36](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/providers/openai.ts#L33-L36), `input.audioRef` (the storage path string) is cast as `unknown` and passed directly as the `file` object.
* **Exploit or Failure Path**: When running with `TRANSCRIPTION_PROVIDER=openai`, any request to transcribe an audio file submits the reference string (e.g. `"tenants/.../media/<uuid>"`) as the multipart payload. The OpenAI Node SDK throws a validation error, causing transcription to crash.
* **Tenant Impact**: Complete failure of the audio transcription pipeline.
* **Confidentiality Impact**: **NONE**
* **Integrity Impact**: **MEDIUM** (prevents transcripts and downstream analysis from being created).
* **Availability Impact**: **HIGH** (inoperable integration).
* **Remediation Status**: **UNREMEDIATED**
* **Retest Requirement**: The adapter must call `this.ctx.storage.get()` to load bytes and package them in a valid `File` or `Blob` instance before passing to the SDK.
* **Release Consequence**: **BLOCKS RELEASE**

---

### AUDIT-004: Non-Portable Logger Runtime Crash
* **Finding ID**: `AUDIT-004`
* **Title**: Non-Portable Logger Runtime Crash
* **Severity**: <span style="color:red">**HIGH**</span> (Release Blocker)
* **Affected Component**: `ConsoleLogger` in [logger.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/shared/logging/logger.ts).
* **Evidence**: Direct execution of `process.stdout.write(...)` without runtime guards.
* **Exploit or Failure Path**: Deploying the application in an edge isolate (Cloudflare Workers) or web browser. The execution fails on the first log call because `process.stdout` is undefined, throwing a fatal `TypeError` and terminating the thread.
* **Tenant Impact**: Complete service outage on Edge/Serverless.
* **Confidentiality Impact**: **NONE**
* **Integrity Impact**: **NONE**
* **Availability Impact**: **HIGH** (process crash).
* **Remediation Status**: **UNREMEDIATED**
* **Retest Requirement**: Check for availability of `process` and `process.stdout`, falling back to `console` API.
* **Release Consequence**: **BLOCKS RELEASE**

---

### AUDIT-005: Shallow Log Redaction
* **Finding ID**: `AUDIT-005`
* **Title**: Shallow Log Redaction
* **Severity**: **MEDIUM** (Release Blocker due to leakage risk)
* **Affected Component**: `redact` function in [redaction.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/shared/security/redaction.ts).
* **Evidence**: Flat loop over object entries in `redact()` logic.
* **Exploit or Failure Path**: Logging structured contextual metadata where sensitive keys are nested (e.g. `{ error: { api_key: "key-123" } }`). The logger stringifies the nested properties as-is, printing secrets to the output streams.
* **Tenant Impact**: Secret, transcript, and file path leakage to log aggregators.
* **Confidentiality Impact**: **MEDIUM** (exposes sensitive secrets/texts).
* **Integrity Impact**: **NONE**
* **Availability Impact**: **NONE**
* **Remediation Status**: **UNREMEDIATED**
* **Retest Requirement**: `redact` must process nested objects recursively.
* **Release Consequence**: **BLOCKS RELEASE**
