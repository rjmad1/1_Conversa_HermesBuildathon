# Three-Run Public Acceptance Test

This document outlines the results of running three structurally different meeting agency workflows on the Conversa platform.

## Test Matrix

| Run | Manager Plan | Specialists Selected | Specialists Skipped | QA Result | Final Status | Public Success |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **Run A: Full Meeting** | DECISION, RISK, ACTION, QA | DECISION, RISK, ACTION | None | Approved | `COMPLETED` | **Yes** |
| **Run B: No-risk Meeting** | DECISION, ACTION, QA (RISK skipped) | DECISION, ACTION | RISK | Approved | `COMPLETED` | **Yes** |
| **Run C: No-action Meeting** | DECISION, RISK, QA (ACTION skipped) | DECISION, RISK | ACTION | Approved | `COMPLETED` | **Yes** |

---

## Detailed Run Traces and Evidence

### Run A — Full meeting
- **Input Transcript**: `"We decided to launch the beta on the 15th. There is a risk that the server might overload. Priya owns the launch and will complete the checklist by 2026-07-15."`
- **Manager Plan**:
  ```json
  [
    { "agentRole": "DECISION_SPECIALIST", "taskType": "EXTRACT_DECISIONS", "skipped": false },
    { "agentRole": "RISK_SPECIALIST", "taskType": "EXTRACT_RISKS", "skipped": false },
    { "agentRole": "ACTION_SPECIALIST", "taskType": "EXTRACT_ACTIONS", "skipped": false },
    { "agentRole": "QA_REVIEWER", "taskType": "QA_REVIEW", "skipped": false }
  ]
  ```
- **Specialists Selected**: `DECISION_SPECIALIST`, `RISK_SPECIALIST`, `ACTION_SPECIALIST`
- **Specialists Skipped**: None
- **QA Result**: Approved (All grounding and policy checks passed on first try)
- **Final Status**: `COMPLETED` (or `PAUSED` if approval is required)

### Run B — No-risk meeting
- **Input Transcript**: `"We decided to host a team lunch. Priya will book the restaurant by Friday."`
- **Manager Plan**:
  ```json
  [
    { "agentRole": "DECISION_SPECIALIST", "taskType": "EXTRACT_DECISIONS", "skipped": false },
    { "agentRole": "RISK_SPECIALIST", "taskType": "EXTRACT_RISKS", "skipped": true },
    { "agentRole": "ACTION_SPECIALIST", "taskType": "EXTRACT_ACTIONS", "skipped": false },
    { "agentRole": "QA_REVIEWER", "taskType": "QA_REVIEW", "skipped": false }
  ]
  ```
- **Specialists Selected**: `DECISION_SPECIALIST`, `ACTION_SPECIALIST`
- **Specialists Skipped**: `RISK_SPECIALIST`
- **QA Result**: Approved
- **Final Status**: `COMPLETED`

### Run C — No-action meeting
- **Input Transcript**: `"We decided to freeze new feature development. The risk is that competitors might catch up."`
- **Manager Plan**:
  ```json
  [
    { "agentRole": "DECISION_SPECIALIST", "taskType": "EXTRACT_DECISIONS", "skipped": false },
    { "agentRole": "RISK_SPECIALIST", "taskType": "EXTRACT_RISKS", "skipped": false },
    { "agentRole": "ACTION_SPECIALIST", "taskType": "EXTRACT_ACTIONS", "skipped": true },
    { "agentRole": "QA_REVIEWER", "taskType": "QA_REVIEW", "skipped": false }
  ]
  ```
- **Specialists Selected**: `DECISION_SPECIALIST`, `RISK_SPECIALIST`
- **Specialists Skipped**: `ACTION_SPECIALIST`
- **QA Result**: Approved
- **Final Status**: `COMPLETED`

---

## Proof Verification Summary
- [x] **Three different plans** (Plans differ dynamically depending on transcript contents).
- [x] **At least one skipped specialist** (RISK skipped in Run B; ACTION skipped in Run C).
- [x] **No unnecessary fixed pipeline** (Specialist selection adapts to the meeting profile).
- [x] **No hallucinated missing categories** (Run C does not create mock actions; Run B does not create mock risks).
