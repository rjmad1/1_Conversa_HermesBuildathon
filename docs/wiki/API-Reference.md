# API Reference

> **Current-state notice:** Conversa is an active Buildathon prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

This document describes the active REST API endpoints exposed by the Conversa Hono server.

---

## Headers Required for All Calls

Except for `/api/health`, all requests require the following isolation scoping headers:
* `x-tenant-id`: A string identifying the current tenant.
* `x-workspace-id`: A string identifying the workspace within the tenant.

> [!WARNING]
> These caller-supplied headers do not constitute secure production credentials. They are spoofable.

---

## Endpoints

### 1. Health Check
* **Route**: `GET /api/health`
* **Response**: `200 OK`
* **Payload**:
  ```json
  { "status": "ok" }
  ```

### 2. Audio Ingestion
* **Route**: `POST /api/v1/meetings/:meetingId/audio`
* **Content-Type**: `multipart/form-data`
  * `file`: Audio payload (MP3/WAV/M4A), size < 10MB.
* **Success**: `201 Created`
  ```json
  {
    "id": "meeting-123",
    "status": "ingested",
    "checksum": "sha256-hash..."
  }
  ```
* **Error**: `415 Unsupported Media Type` (if video is uploaded).

### 3. Transcript Analysis (Pasted)
* **Route**: `POST /api/v1/meetings/:meetingId/transcript`
* **Content-Type**: `application/json`
* **Payload**:
  ```json
  {
    "transcript": "Alice: We need to finish the API docs by Friday.",
    "apiKey": "sk-..."
  }
  ```
* **Success**: `200 OK`
  ```json
  {
    "summary": "Meeting regarding API docs.",
    "decisions": ["Finish the API docs by Friday."],
    "risks": ["Alice has high workload."],
    "actionItems": [
      {
        "id": "action-1",
        "title": "Finish the API docs",
        "owner": "Alice",
        "dueDate": "2026-07-17",
        "system": "Jira",
        "status": "PROPOSED"
      }
    ]
  }
  ```

### 4. Approve Action
* **Route**: `POST /api/v1/actions/:actionId/approve`
* **Response**: `200 OK`
  ```json
  {
    "id": "action-1",
    "status": "APPROVED"
  }
  ```

### 5. Reject Action
* **Route**: `POST /api/v1/actions/:actionId/reject`
* **Response**: `200 OK`
  ```json
  {
    "id": "action-1",
    "status": "REJECTED"
  }
  ```

### 6. Audit Logs
* **Route**: `GET /api/v1/audits`
* **Response**: `200 OK` (list of tenant-scoped runtime logs).
