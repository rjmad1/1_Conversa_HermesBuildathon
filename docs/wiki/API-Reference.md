# API Reference

> **Current-state notice:** Conversa is an active MVP prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

This page documents the currently implemented REST API exposed by `src/app/index.ts`.

---

## Required Headers

For all `/api/v1/*` routes, callers should provide:

- `x-tenant-id`
- `x-workspace-id`
- `x-actor-id` (optional in dev; defaults to `dev-user`)

> [!WARNING]
> These headers are **development identity inputs**, not secure production authentication.

---

## Health

### `GET /api/health/live`
Liveness probe.

### `GET /api/health/ready`
Readiness probe.

---

## Meetings

### `POST /api/v1/meetings`
Create a meeting.

Request body:

```json
{
  "title": "Sprint Planning",
  "meetingType": "CEREMONY",
  "scheduledAt": "2026-07-12T10:00:00Z"
}
```

Returns `201` with `{ data, correlationId }`.

### `GET /api/v1/meetings/:meetingId`
Fetch one meeting in current scope.

---

## Audio and Transcript

### `POST /api/v1/meetings/:meetingId/audio`
Upload one audio file using `multipart/form-data` (`file`).

- Allowed formats: MP3, WAV, M4A
- Video media is rejected

Returns `201` with stored audio metadata.

### `POST /api/v1/meetings/:meetingId/transcription`
Run transcription for the meeting audio asset.

Returns `200` with transcript payload.

### `POST /api/v1/meetings/:meetingId/transcript`
Submit a pasted transcript directly.

Request body:

```json
{
  "content": "We will launch the beta on the 15th. Priya owns the launch."
}
```

Returns `201` with transcript payload.

---

## Analysis

### `POST /api/v1/meetings/:meetingId/analysis`
Generate meeting analysis from transcript.

Returns `201` with analysis payload.

### `GET /api/v1/meetings/:meetingId/analysis`
Fetch latest meeting analysis in current tenant/workspace scope.

Returns `200` if found, `404` if not found or out-of-scope.

---

## Actions (Human Governance)

### `POST /api/v1/actions/:actionId/approve`
Approve a proposed action.

Returns `200` with `{ data: { approved: true }, correlationId }`.

### `POST /api/v1/actions/:actionId/reject`
Reject a proposed action.

Request body:

```json
{
  "reason": "Not aligned with this sprint"
}
```

Returns `200` with `{ data: { rejected: true }, correlationId }`.

---

## Audit

### `GET /api/v1/meetings/:meetingId/audit`
List audit events for one meeting in current scope.

Returns `200` with ordered event list.

---

## Error Shape

All errors use:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Meeting not found",
    "details": {},
    "retryable": false
  },
  "correlationId": "..."
}
```
