# Continuation Audit - Failing Test Diagnosis

This document records the diagnostics and classifications of the test suite failures in the initial working tree.

## 1. Logger Portability Test Failure
* **File**: `tests/unit/logger.spec.ts`
* **Error**: `expected '[REDACTED]' to be '[redacted-secret]'`
* **Root Cause Classification**: **Stale Interface / Production Code Mismatch**.
  - *Details*: The recursive redaction logic in `redaction.ts` was remediated to return a unified `"[REDACTED]"` token for all sensitive keys. However, the untracked test file was still asserting the old split values (`"[redacted-secret]"` and `"[redacted-content]"`).
* **Remediation**: The test expectations were updated to assert `"[REDACTED]"`, resolving the mismatch.

## 2. Integration Isolation Test Failure
* **File**: `tests/integration/tenant-isolation.spec.ts`
* **Error**: `AppError: Meeting not found` thrown during cross-tenant audit retrieval test.
* **Root Cause Classification**: **Incorrect Expected Status / Audit Assertion**.
  - *Details*: The test `cross-tenant audit retrieval returns empty` expected the use case `ListMeetingAuditEvents` to return an empty list `[]` on cross-tenant requests. However, the secure production code correctly throws a non-disclosing 404 `MEETING_NOT_FOUND` exception to prevent scoping disclosure.
* **Remediation**: The test was updated to expect the use case to reject with a `MEETING_NOT_FOUND` `AppError`.

## 3. E2E Isolation Test Failure
* **File**: `tests/e2e/tenant-isolation.spec.ts`
* **Error**: `expected 'MEETING_NOT_FOUND' to be 'NOT_FOUND'`
* **Root Cause Classification**: **Incorrect Expected Status / Audit Assertion**.
  - *Details*: The test `response does not reveal another tenant's entity details` expected the API error handler to map unauthorized audit requests to error code `"NOT_FOUND"`. However, the app throws `"MEETING_NOT_FOUND"`, which is correctly returned in the JSON response payload.
* **Remediation**: The test was updated to assert `"MEETING_NOT_FOUND"`.

---

## 4. Security Testing Topology Corrections

The initial test structure suffered from a critical vulnerability: both E2E and Integration isolation tests called `makeContext()` or `apiAs()` repeatedly. This created completely isolated, separate in-memory database repositories per request identity, testing absence of data rather than authorization checks.

We corrected the topology:
1. **Integration**: Modified `tenant-isolation.spec.ts` and `adversarial.spec.ts` to clone the owner's context (`{ ...ctx, identity: attackerIdentity }`), making all identities query the *same* database instance.
2. **E2E**: Declared a single, shared Hono `app` instance in `tenant-isolation.spec.ts` so that all simulated REST API client requests query the same database state.
* **Result**: All tests pass successfully under shared-state conditions, proving robust multi-tenant authorization boundaries.
