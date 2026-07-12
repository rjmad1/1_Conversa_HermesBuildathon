# Continuation Audit - Smoke Test Results

This document records the results of the fake-provider smoke test executed in the stabilized repository.

* **Executed Command**: `npx vite-node security-audit-artifacts/remediation-verification/smoke-test.ts`
* **Exit Code**: `0`

## Smoke Test Log Output

```text
=== START VERIFICATION SMOKE TEST ===
1. Checking health endpoints...
   - GET /api/health/live -> HTTP 200: OK
   - GET /api/health/ready -> HTTP 200: OK
2. Creating meeting under owner-tenant/owner-workspace...
   - POST /api/v1/meetings -> HTTP 201: OK
   - Meeting created: ID = efd1c093-c8f8-4e53-82a3-865a3efd2f4f
3 & 4. Registering audio and uploading synthetic bytes...
   - POST /api/v1/meetings/:id/audio -> HTTP 201: OK
   - Audio asset registered, storageReference = tenants/owner-tenant/workspaces/owner-workspace/media/4f14e7a2-a4c0-44a7-8fc0-79f47922ebb6
5 & 6. Running transcription...
   - POST /api/v1/meetings/:id/transcription -> HTTP 200: OK
   - Transcript persisted: ID = 8444e0b5-d438-4ee2-8787-96388ff6c130
7. Generating analysis...
   - POST /api/v1/meetings/:id/analysis -> HTTP 201: OK
   - Analysis created with action item ID = 49fd8bd4-e5a0-44df-9b35-239d63aff6c2
8. Retrieving analysis as owner...
   - GET /api/v1/meetings/:id/analysis (Owner headers) -> HTTP 200: OK
9. Retrieving analysis as wrong-tenant...
   - GET /api/v1/meetings/:id/analysis (Tenant B headers) -> HTTP 404: OK
10. Retrieving analysis as wrong-workspace...
    - GET /api/v1/meetings/:id/analysis (Workspace B headers) -> HTTP 404: OK
11 & 12. Performing action approval as owner...
    - POST /api/v1/actions/:actionId/approve (Owner headers) -> HTTP 200: OK
13. Attempting approval as wrong-tenant...
    - POST /api/v1/actions/:actionId/approve (Tenant B headers) -> HTTP 404: OK
14. Attempting approval as wrong-workspace...
    - POST /api/v1/actions/:actionId/approve (Workspace B headers) -> HTTP 404: OK
15. Retrieving audit events as owner...
    - GET /api/v1/meetings/:id/audit (Owner headers) -> HTTP 200: OK
16. Retrieving audit events as wrong-tenant...
    - GET /api/v1/meetings/:id/audit (Tenant B headers) -> HTTP 404: OK
17. Verifying structured logging output...
    - LogEntry format verified. operation="CreateMeeting", level="info", msg="meeting created" matches schemas.
18. Verifying deep redaction on logs...
    - redact() invoked with deep nested credentials.
    - apiKey -> [REDACTED]
    - password -> [REDACTED]
    - storageReference -> [REDACTED]
    - normal -> ok (benign preserved)
=== VERIFICATION SMOKE TEST PASSED SUCCESSFULLY ===
```
