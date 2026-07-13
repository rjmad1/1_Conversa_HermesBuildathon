# Conversa — REST API Specification

---
### 📋 Document Metadata
- **Purpose**: Describes all public REST API endpoints, request/response JSON schemas, headers, rate limits, and error handling.
- **Audience**: Frontend engineers, integration developers, QA automation, and API consumers.
- **Last Generated**: 2026-07-13T05:20:47+05:30
- **Confidence Level**: High (Derived directly from REST router paths and schemas in `src/app/index.ts`).
- **Evidence Used**: Core server endpoints, middlewares, and Vitest endpoint validations.
- **Cross References**: See [ARCHITECTURE.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/ARCHITECTURE.md), [SECURITY.md](file:///c:/Users/rajaj/Projects/1_Conversa/SECURITY.md), [DATABASE.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/DATABASE.md).
- **Open Questions**: Rotation policy for static Bearer tokens.
- **Known Limitations**: ephemerality of in-memory data; no API pagination.
- **Recommended Next Actions**: Hook up webhook event dispatching on action approvals.
---

## 1. Authentication & Tenancy Headers

### 1.1 Production Authentication
In production, every API request requires:
- `Authorization: Bearer <token>`
- The token is verified server-side against mapped credentials. Dev tenancy headers are ignored, scoping requests implicitly.

### 1.2 Development Headers
In development / test configurations (with `ALLOW_DEV_IDENTITY=true`):
- `X-Tenant-Id`: Logical tenant scope (default: `demo`).
- `X-Workspace-Id`: Logical workspace scope (default: `demo`).
- `X-Actor-Id`: Caller ID (e.g. `dev-user`).

---

## 2. API Endpoints

### 2.1 Workspace Resets
* **Endpoint**: `POST /api/v1/workspace/reset`
* **Auth Role Required**: `admin`
* **Description**: Deletes all data (meetings, audio, audits, runs) matching the caller's tenant and workspace.
* **Response**: `200 OK`
  ```json
  {
    "data": { "reset": true },
    "correlationId": "uuid-string"
  }
  ```

### 2.2 Meetings CRUD
* **Endpoint**: `POST /api/v1/meetings`
* **Auth Role Required**: `approver` or `admin`
* **Payload**:
  ```json
  {
    "title": "Weekly Sprint Planning",
    "meetingType": "CEREMONY",
    "scheduledAt": "2026-07-13T05:20:47Z"
  }
  ```
* **Response**: `201 Created`

* **Endpoint**: `GET /api/v1/meetings/:meetingId`
* **Auth Role Required**: `viewer`, `approver`, or `admin`
* **Response**: `200 OK`

### 2.3 Audio Ingestion & Ingestion Validation
* **Endpoint**: `POST /api/v1/meetings/:meetingId/audio`
* **Auth Role Required**: `approver` or `admin`
* **Content-Type**: `multipart/form-data`
  * Form Parameter: `file` (MP3, WAV, M4A up to `AUDIO_MAX_BYTES`)
* **Response**: `201 Created`
  ```json
  {
    "data": {
      "id": "audio-uuid",
      "meetingId": "meeting-uuid",
      "fileName": "meeting-audio.mp3",
      "fileSize": 451203,
      "mimeType": "audio/mpeg",
      "checksum": "sha256-string",
      "storageReference": "scoped-path-string"
    },
    "correlationId": "uuid-string"
  }
  ```
* **Error**: `415 Unsupported Media Type` if video uploaded.

### 2.4 Transcription Submission & Trigger
* **Endpoint**: `POST /api/v1/meetings/:meetingId/transcript`
* **Description**: Passthrough submit plain text transcript (bypassing audio).
* **Payload**: `{"content": "Speaker 1: hello ... (min 10 chars)"}`
* **Response**: `201 Created`

* **Endpoint**: `POST /api/v1/meetings/:meetingId/transcription`
* **Description**: Transcribes the uploaded audio using Whisper.
* **Response**: `200 OK`

### 2.5 Multi-Agent Analysis Coordination
* **Endpoint**: `POST /api/v1/meetings/:meetingId/agency/run`
* **Description**: Triggers the Specialist Agent crew sequence.
* **Payload**:
  ```json
  {
    "enabledRoles": {
      "DECISION_SPECIALIST": true,
      "RISK_SPECIALIST": true,
      "ACTION_SPECIALIST": true
    },
    "confidenceThreshold": 0.8,
    "approvalRequirement": true
  }
  ```
* **Response**: `201 Created` (Returns `AgencyRun` details).

### 2.6 Approvals Endpoints
* **Endpoint**: `POST /api/v1/actions/:actionId/approve`
* **Description**: Approves proposed action.
* **Response**: `200 OK`

* **Endpoint**: `POST /api/v1/actions/:actionId/reject`
* **Payload**: `{"reason": "Wrong owner"}`
* **Response**: `200 OK`

---

## 3. Error Codes & Payloads
Standard error payloads utilize the following schema:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "File size exceeds limit",
    "details": {},
    "retryable": false
  },
  "correlationId": "uuid-string"
}
```

### Common Error Codes
* `VALIDATION_ERROR`: Field validation failed (HTTP 400).
* `UNAUTHORIZED`: Authentication missing or token invalid (HTTP 401).
* `NOT_FOUND`: Entity not found (HTTP 404).
* `TOO_MANY_REQUESTS`: Rate limit exceeded (HTTP 429).
* `INTERNAL`: Generic internal server error (HTTP 500).
