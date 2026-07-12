# API Contract Review Pack

This document outlines the design expectations, validation constraints, and error handling contracts for the 12 core HTTP endpoints of the Conversa Audio-to-Governed-Action platform.

---

## Global API Standards

### 1. Error Envelope Structure
Every API error response must match the following unified JSON shape:
```json
{
  "code": "STABLE_ERROR_CODE",
  "message": "Human-readable error description.",
  "details": [
    {
      "field": "body.title",
      "received": null,
      "allowed": "string (1-300 characters)"
    }
  ]
}
```

### 2. Stable Error Codes
* `UNSUPPORTED_MEDIA_TYPE` (HTTP 415) — Video or invalid files uploaded.
* `VALIDATION_ERROR` (HTTP 400/422) — Missing fields, wrong types, size/duration limit violations.
* `NOT_FOUND` / `MEETING_NOT_FOUND` (HTTP 404) — Target resource does not exist or belongs to a different tenant (isolation default).
* `TENANT_MISMATCH` (HTTP 403/404) — Mismatch between identity headers and resource ownership.
* `INVALID_STATE_TRANSITION` (HTTP 400/409) — Operations attempted on completed/invalid resources.
* `REJECTION_REASON_REQUIRED` (HTTP 400) — Rejecting actions without a non-empty reason.
* `TRANSCRIPTION_FAILED` (HTTP 502) — Failures inside AI transcription provider.
* `ANALYSIS_FAILED` (HTTP 502/422) — Failures in extracting structured actions.
* `PROVIDER_ERROR` (HTTP 502) — Third-party timeout or credential issues.
* `DUPLICATE` (HTTP 200/409) — Idempotent operations or duplicate submissions.
* `INTERNAL` (HTTP 500) — Server crash.

### 3. Context & Security Headers
* **Tenant & Workspace**: Must be parsed via `X-Tenant-Id` and `X-Workspace-Id` headers.
* **Identity Actor**: Passed via `X-Actor-Id`.
* **Correlation**: Every request should support `X-Correlation-Id` for tracing. If missing, the API must generate one.

---

## Endpoint Specifications

### 1. `POST /api/v1/meetings`
* **Purpose**: Initialize a meeting metadata record.
* **Auth Context**: Requires user token (RBAC: `meeting:write`).
* **Tenant/Workspace Scope**: Resolved from headers; written to meeting record.
* **Request Validation**:
  * Body: `CreateMeetingInputSchema` (title: 1-300 chars, meetingType: 1-80 chars, scheduledAt: ISO datetime string).
* **Response Validation**:
  * Body: `MeetingSchema` containing generated `id` (UUID), status `"DRAFT"`, created metadata.
* **Status Codes**: `201 Created` on success; `400 Bad Request` on validation failure.
* **Idempotency**: Standard CRUD post (no deduplication required).

### 2. `GET /api/v1/meetings/:meetingId`
* **Purpose**: Fetch meeting details.
* **Auth Context**: RBAC: `meeting:read`.
* **Tenant/Workspace Scope**: Request tenant must match the meeting's tenant.
* **Cross-Tenant Constraint**: Mismatched tenant must return `404 Not Found` (preferred to avoid leaking resource existence).
* **Response Validation**: `MeetingSchema` JSON.
* **Status Codes**: `200 OK`, `404 Not Found`.

### 3. `POST /api/v1/meetings/:meetingId/audio`
* **Purpose**: Ingest meeting audio files.
* **Auth Context**: RBAC: `meeting:write`.
* **Request Validation**:
  * Content-Type: `multipart/form-data`.
  * Part: `file` (MP3, WAV, or M4A binary stream).
* **Content Limits**: Max size `10 MB`, max duration `7200s`. Empty files rejected.
* **Unsupported Media**: Video formats (`video/*`, `.mp4`) reject immediately with `415 UNSUPPORTED_MEDIA_TYPE`.
* **Idempotency**: Generates SHA-256 `checksum` of the file bytes. If the checksum matches an existing audio asset in this meeting, skips storage write and returns the existing record (`200 OK`).
* **Status Codes**: `201 Created` (new asset), `200 OK` (duplicate asset), `415 Unsupported Media Type` (video), `400 Bad Request` (exceeds size/duration limit, extension mismatch).

### 4. `POST /api/v1/meetings/:meetingId/transcript`
* **Purpose**: Paste plain-text transcript.
* **Auth Context**: RBAC: `meeting:write`.
* **BYOK Requirement**: Requires user OpenAI key in header `Authorization: Bearer <key>` for downstream analysis.
* **Request Validation**:
  * Body: `{"content": "..."}` (10 to 50,000 characters).
* **Idempotency**: Submitting identical text twice for the same meeting returns the existing `Transcript` record (`200 OK`).
* **Status Codes**: `201 Created`, `200 OK` (duplicate), `400 Bad Request` (length validation failure, missing BYOK key).

### 5. `POST /api/v1/meetings/:meetingId/transcription`
* **Purpose**: Run audio transcription via OpenAI Whisper.
* **Auth Context**: RBAC: `meeting:write`.
* **Concurrency**: Only one transcription execution allowed per meeting. Concurrency blocks should return `409 Conflict`.
* **Response Validation**: Returns generated `Transcript` object with status `READY`, `source: "TRANSCRIPTION"`.
* **Status Codes**: `201 Created`, `502 Bad Gateway` (transcription timeouts or API failure).

### 6. `POST /api/v1/meetings/:meetingId/analysis`
* **Purpose**: Run GPT analysis on transcript to extract actions/decisions.
* **Auth Context**: RBAC: `meeting:write`.
* **Idempotency**: Analysis key format: `analyze:{transcriptId}`. Repeated requests return cached `MeetingAnalysis` (`200 OK`) unless the transcript has changed.
* **Status Codes**: `201 Created`, `200 OK` (cached), `422 Unprocessable Entity` (malformed LLM outputs), `502 Bad Gateway`.

### 7. `GET /api/v1/meetings/:meetingId/analysis`
* **Purpose**: Retrieve the extracted analysis, including proposed actions.
* **Auth Context**: RBAC: `meeting:read`.
* **Cross-Tenant Constraint**: Returns `404 Not Found` if the meeting belongs to a different tenant.
* **Response Validation**: `MeetingAnalysisSchema` JSON.
* **Status Codes**: `200 OK`, `404 Not Found`.

### 8. `POST /api/v1/actions/:actionId/approve`
* **Purpose**: Approve a proposed action.
* **Auth Context**: RBAC: `action:write`.
* **Cross-Tenant Constraint**: The API must load the parent meeting to verify the tenant ownership of the action. Cross-tenant request -> `404 Not Found`.
* **Idempotency**: Repeated approvals return `200 OK` and leave state in `APPROVED`.
* **Status Codes**: `200 OK`, `404 Not Found`, `409 Conflict` (if state conflicts).

### 9. `POST /api/v1/actions/:actionId/reject`
* **Purpose**: Reject a proposed action.
* **Auth Context**: RBAC: `action:write`.
* **Request Validation**: Body must contain a non-empty `{"reason": "string"}`.
* **Idempotency**: Repeated rejections return `200 OK`.
* **Status Codes**: `200 OK`, `400 Bad Request` (missing/empty reason), `404 Not Found`.

### 10. `GET /api/v1/meetings/:meetingId/audit`
* **Purpose**: Retrieve the chronological audit log for the meeting.
* **Auth Context**: RBAC: `audit:read`.
* **Sensitive-Data Exposure Check**: Ensure audit event payloads do not leak API keys, credit cards, or raw transcription text blocks in metadata.
* **Response Validation**: Array of `AuditEventSchema` sorted ascending by `createdAt`.
* **Status Codes**: `200 OK`, `404 Not Found`.

### 11. `GET /api/health/live`
* **Purpose**: Kubernetes liveness probe.
* **Auth Context**: Public (No authentication required).
* **Performance Requirement**: Returns immediate `200 OK` (JSON: `{"live": true}`). Must not run downstream database or API provider checks.
* **Status Codes**: `200 OK`.

### 12. `GET /api/health/ready`
* **Purpose**: Kubernetes readiness probe.
* **Auth Context**: Public.
* **Dependency Check**: Verifies persistence DB and provider settings. Returns `503 Service Unavailable` if dependencies fail.
* **Status Codes**: `200 OK` (all ready), `503 Service Unavailable` (degraded dependency).
