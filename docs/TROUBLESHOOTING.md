# Conversa — Diagnostics & Troubleshooting Manual

---
### 📋 Document Metadata
- **Purpose**: Diagnostic guide detailing error resolution steps, recovery commands, logs, and system states.
- **Audience**: Site reliability engineers (SREs), DevOps, system administrators, and customer support.
- **Last Generated**: 2026-07-13T05:20:47+05:30
- **Confidence Level**: High (Verified against runtime middleware behavior and REST error structures).
- **Evidence Used**: Server error handlers (`AppError`), status codes, and recovery routes.
- **Cross References**: See [OBSERVABILITY.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/OBSERVABILITY.md), [WORKFLOWS.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/WORKFLOWS.md), [KNOWN_ISSUES.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/KNOWN_ISSUES.md).
- **Open Questions**: Automated alerts on Slack during incident escalations.
- **Known Limitations**: Ephemeral DB maps restrict diagnostics persistence.
- **Recommended Next Actions**: Enforce TLS and HTTPS verification at deployment gateway.
---

## 1. Symptom Diagnostic Matrix

| Error Status / Code | Likely Root Cause | Diagnostic Command | Recovery Action |
| --- | --- | --- | --- |
| **HTTP 415** (`UNSUPPORTED_MEDIA_TYPE`) | Video file upload was attempted. | Check request headers: `Content-Type: video/mp4` | Conversa is audio-first. Re-upload meeting file in MP3, WAV, or M4A formats. |
| **HTTP 413** (`Payload Too Large`) | Audio upload size exceeded `AUDIO_MAX_BYTES` (10MB). | Check HTTP header: `Content-Length` | Compress the audio file or trim its duration before attempting ingestion. |
| **HTTP 429** (`Too Many Requests`) | Rate limit reached on transcription, analysis, or reset endpoints. | Check server logs for client IP rate counters. | Wait 60 seconds (rate window resets automatically). |
| **HTTP 403** (`Forbidden`) | Role check failed. Non-admin tried to reset; non-approver tried mutations. | Inspect the Bearer token in the `Authorization` header. | Use the correct Bearer token credentials associated with the required role. |
| **Agency Run status ESCALATED** | The QA Reviewer agent detected a policy violation or unresolved ambiguity. | Check `GET /api/v1/agency/runs/:runId` | Address the blocker and re-run the step using the retry API endpoint. |
| **HTTP 404** (`NOT_FOUND` / Storage Missing) | In-memory storage was cleared on server reboot or reset. | Inspect DB logs for the meeting UUID. | Re-create the meeting and re-upload the audio file. Persistence is volatile. |

---

## 2. Command Diagnostic Tooling

* **Verify API Status & Liveness**:
  ```bash
  curl -X GET http://localhost:5173/api/health/live
  ```

* **Verify Dependency Readiness**:
  ```bash
  curl -X GET http://localhost:5173/api/health/ready
  ```

* **Trigger Specialist Step Recovery Retry**:
  ```bash
  curl -X POST http://localhost:5173/api/v1/agency/runs/{runId}/steps/{stepId}/retry \
    -H "Authorization: Bearer approver-token"
  ```
