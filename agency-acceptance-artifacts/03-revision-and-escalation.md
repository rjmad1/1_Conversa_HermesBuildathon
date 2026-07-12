# Revision and Escalation Verification

This document verifies the revision loop and escalation functionality in Conversa's managed AI agency.

## 1. Revision-Loop Test (Case 17)

- **Input Transcript**: `"Priya needs to deploy the hotfix immediately. No due date was given."`
- **Initial Specialist Output**:
  - `ACTION_SPECIALIST` extracts:
    ```json
    [
      {
        "description": "Deploy hotfix.",
        "ownerName": "Priya",
        "dueDate": null,
        "priority": "HIGH",
        "targetSystem": "PRODUCTION",
        "actionType": "DEPLOYMENT",
        "rationale": "Hotfix deployment required immediately.",
        "sourceEvidence": "Priya needs to deploy the hotfix immediately.",
        "confidence": 0.9,
        "riskLevel": "HIGH"
      }
    ]
    ```
- **QA Rejection**:
  - **Reason**: `"Hotfix action requires a valid future due date under policy P2."`
  - **Status**: Rejected, requires revision.
- **Feedback Loop**:
  - The revision reason is appended to `handoff.policyConstraints` as `"Hotfix action requires a valid future due date under policy P2."`.
  - The initial findings are supplied as `handoff.priorFindings`.
- **Specialist Revised Output**:
  - The `ACTION_SPECIALIST` receives the constraint, detects `due date` in constraints, and corrects the action:
    ```json
    [
      {
        "description": "Deploy hotfix.",
        "ownerName": "Priya",
        "dueDate": "2026-07-13T00:00:00.000Z",
        "priority": "HIGH",
        "targetSystem": "PRODUCTION",
        "actionType": "DEPLOYMENT",
        "rationale": "Hotfix deployment required immediately.",
        "sourceEvidence": "Priya needs to deploy the hotfix immediately.",
        "confidence": 0.9,
        "riskLevel": "HIGH"
      }
    ]
    ```
- **QA Resolution**:
  - Approved.
- **Trace Evidence**:
  - **Revision Count**: `1` (The `ACTION_SPECIALIST` step completed successfully after exactly 1 revision).
  - **Step Status**: `COMPLETED`.
  - **Run Status**: `COMPLETED`.

---

## 2. Escalation Test (Case 18)

- **Input Transcript**: `"Someone needs to fix the broken build. But we don't know who owns the codebase, and no one is available."`
- **Initial Specialist Output**:
  - `DECISION_SPECIALIST` runs first (findings: `[]` decisions).
- **QA Review & Escalation**:
  - **Condition**: Detection of unresolved ambiguity in codebase ownership and team unavailability.
  - **Action**: QA reviewer triggers immediate escalation rather than guessing or invent-forcing information.
  - **Escalation Details**:
    - **Reason**: `"Unresolved build owner and unavailability blocks action planning."`
    - **Affected step**: `DECISION_SPECIALIST` (first step in the sequence).
    - **Run Status**: Immediately transitions to `ESCALATED`.
    - **Final outcome**: No auto-approval occurs. The workflow halts to wait for human operator intervention.
- **Audit Logs**:
  - An audit event is recorded with `eventType: "ESCALATION_RAISED"` containing the details of the block.
