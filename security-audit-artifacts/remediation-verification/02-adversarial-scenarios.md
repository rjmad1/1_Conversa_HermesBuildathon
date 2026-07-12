# Adversarial Access Scenarios

This document specifies the adversarial access scenarios executed against the Conversa deployment using real integration endpoints to verify tenant and workspace boundaries.

## Verification Execution Details

* **Test Engine**: Standalone Node runtime executing HTTP requests against Hono via `vite-node`.
* **Audited Execution Script**: [adversarial-runner.ts](file:///c:/Users/rajaj/Projects/1_Conversa/security-audit-artifacts/remediation-verification/adversarial-runner.ts)
* **Audited Version**: Commit `dd7d984` containing the implementation agent's proposed remediation.

---

## Scenario Logs & Verdicts

### Scenario T1: Authorized Read
* **Scenario ID**: `ADV-T1`
* **Setup**: Tenant A (`tenant-a`, `workspace-a`) creates a meeting, submits a transcript, and generates an analysis.
* **Request**: `GET /api/v1/meetings/:meetingId/analysis` (using Tenant A headers)
* **Expected Result**: HTTP `200 OK` returning Tenant A's meeting analysis.
* **Actual Result**: HTTP `200 OK` with Tenant A's analysis returned.
* **HTTP Status / App Error**: `200 OK` / None.
* **Data Exposure**: None (authorized).
* **Audit Evidence**: Standard route logger outputs success.
* **Verdict**: **PASS**

### Scenario T2: Cross-Tenant Analysis Leak
* **Scenario ID**: `ADV-T2`
* **Setup**: Tenant A meeting analysis has been created. Tenant B (`tenant-b`, `workspace-b`) retrieves the analysis using Tenant A's known `meetingId`.
* **Request**: `GET /api/v1/meetings/:meetingId/analysis` (using Tenant B headers)
* **Expected Result**: HTTP `404 Not Found` or `403 Forbidden`.
* **Actual Result**: HTTP `200 OK` containing Tenant A's confidential meeting summary, decisions, actions, and risks.
* **HTTP Status / App Error**: `200 OK` / None.
* **Data Exposure**: **CRITICAL** (complete leak of confidential transcript analysis to a foreign tenant).
* **Audit Evidence**: `Scenario T2 (Tenant B reads Tenant A analysis): HTTP 200`
* **Verdict**: <span style="color:red">**FAIL**</span>

### Scenario T3: Cross-Tenant Action Approval
* **Scenario ID**: `ADV-T3`
* **Setup**: Tenant A action item is in `PROPOSED` status. Tenant B attempts to approve the action.
* **Request**: `POST /api/v1/actions/:actionId/approve` (using Tenant B headers)
* **Expected Result**: HTTP `404 Not Found` or `403 Forbidden`.
* **Actual Result**: HTTP `200 OK` with `{ "approved": true }` payload.
* **HTTP Status / App Error**: `200 OK` / None.
* **Data Exposure**: Integrity violation (unauthorized state mutation of Tenant A's proposed action by Tenant B).
* **Audit Evidence**: `{"ts":"...","level":"info","msg":"action approved","operation":"ApproveProposedAction","correlationId":"...","outcome":"success"}`
* **Verdict**: <span style="color:red">**FAIL**</span>

### Scenario T4: Cross-Tenant Action Rejection
* **Scenario ID**: `ADV-T4`
* **Setup**: Tenant A action item is in `PROPOSED` status. Tenant B attempts to reject the action.
* **Request**: `POST /api/v1/actions/:actionId/reject` (using Tenant B headers)
* **Expected Result**: HTTP `404 Not Found` or `403 Forbidden`.
* **Actual Result**: HTTP `409 Conflict` (due to Scenario T3 already changing the state to `APPROVED`, verifying that the routing allowed Tenant B to reach the state transition logic).
* **HTTP Status / App Error**: `409 Conflict` / `INVALID_STATE_TRANSITION`.
* **Data Exposure**: Integrity violation (state evaluation permitted for foreign tenants; would succeed if action was still in `PROPOSED`).
* **Audit Evidence**: `Scenario T4 (Tenant B rejects Tenant A action): HTTP 409`
* **Verdict**: <span style="color:red">**FAIL**</span>

### Scenario T5: Cross-Tenant Audit Log Leak
* **Scenario ID**: `ADV-T5`
* **Setup**: Tenant A meeting has audit logs. Tenant B requests the audit trail.
* **Request**: `GET /api/v1/meetings/:meetingId/audit` (using Tenant B headers)
* **Expected Result**: HTTP `404 Not Found` or `403 Forbidden`.
* **Actual Result**: HTTP `404 Not Found` containing `{"error": {"code": "MEETING_NOT_FOUND", "message": "Meeting not found"}}`.
* **HTTP Status / App Error**: `404 Not Found` / `MEETING_NOT_FOUND`.
* **Data Exposure**: None (meeting lookups are safely scoped at the usecase layer).
* **Audit Evidence**: `Scenario T5 (Tenant B reads Tenant A audit events): HTTP 404`
* **Verdict**: **PASS**

### Scenario W2: Cross-Workspace Analysis Leak (Same Tenant)
* **Scenario ID**: `ADV-W2`
* **Setup**: Tenant A, Workspace A meeting analysis exists. Workspace B user under Tenant A attempts to read it.
* **Request**: `GET /api/v1/meetings/:meetingId/analysis` (using Tenant A, Workspace B headers)
* **Expected Result**: HTTP `404 Not Found` or `403 Forbidden`.
* **Actual Result**: HTTP `200 OK` returning Workspace A's analysis.
* **HTTP Status / App Error**: `200 OK` / None.
* **Data Exposure**: Confidentiality leak across department/workspace boundaries.
* **Audit Evidence**: `Scenario W2 (Workspace B reads Workspace A analysis): HTTP 200`
* **Verdict**: <span style="color:red">**FAIL**</span>

### Scenario W3: Cross-Workspace Action Approval (Same Tenant)
* **Scenario ID**: `ADV-W3`
* **Setup**: Tenant A, Workspace A action is proposed. Workspace B attempts to approve.
* **Request**: `POST /api/v1/actions/:actionId/approve` (using Tenant A, Workspace B headers)
* **Expected Result**: HTTP `404 Not Found` or `403 Forbidden`.
* **Actual Result**: HTTP `409 Conflict` (fails only due to state transition constraint, not isolation checks; otherwise would succeed).
* **HTTP Status / App Error**: `409 Conflict` / `INVALID_STATE_TRANSITION`.
* **Data Exposure**: Integrity violation across workspace boundaries.
* **Audit Evidence**: `Scenario W3 (Workspace B approves Workspace A action): HTTP 409`
* **Verdict**: <span style="color:red">**FAIL**</span>

### Scenario W4: Workspace String Match with Tenant Mismatch
* **Scenario ID**: `ADV-W4`
* **Setup**: Meeting exists under Tenant A, Workspace A. User belongs to Tenant B, Workspace A (workspace ID strings match but tenants differ).
* **Request**: `GET /api/v1/meetings/:meetingId/analysis`
* **Expected Result**: HTTP `404 Not Found` or `403 Forbidden`.
* **Actual Result**: HTTP `200 OK` returning Tenant A's analysis.
* **HTTP Status / App Error**: `200 OK` / None.
* **Data Exposure**: Confidentiality leak due to insufficient validation of both scope fields simultaneously.
* **Audit Evidence**: `Scenario W4 (Tenant B Workspace A reads Tenant A Workspace A analysis): HTTP 200`
* **Verdict**: <span style="color:red">**FAIL**</span>

### Scenario I1: Random/Predictable UUID Enumeration
* **Scenario ID**: `ADV-I1`
* **Setup**: Randomly generated but valid UUID.
* **Request**: `GET /api/v1/meetings/d3b07384-d113-4ec2-a279-d75d50699ee5/analysis`
* **Expected Result**: HTTP `404 Not Found` / `NOT_FOUND`.
* **Actual Result**: HTTP `404 Not Found` / `NOT_FOUND`.
* **HTTP Status / App Error**: `404 Not Found` / `NOT_FOUND`.
* **Data Exposure**: None.
* **Verdict**: **PASS**
