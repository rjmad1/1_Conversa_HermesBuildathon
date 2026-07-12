# Memory and Handoff Verification

This document audits context handoffs and memory isolation behaviors in Conversa.

## Handoff and Memory Capabilities

- **Current-task context reaches specialists**: **Verified**. The manager places the transcript content inside `handoff.relevantContext` which is consumed by the specialist classes to perform extraction.
- **Prior specialist findings reach QA**: **Verified**. `RunMeetingAgency` accumulates decisions, risks, and proposed actions across steps. This is stored in `handoff.priorFindings` and sent to the QA Reviewer at each step.
- **QA feedback reaches revision attempt**: **Verified**. If QA rejects, the feedback reason is added to `handoff.policyConstraints`, and the updated envelope is passed into the subsequent execution attempt.
- **Follow-up task reuses meeting context**: **Verified**. The meeting id is retrieved from the workspace scope, allowing subsequent transcript submissions or analyses to operate on the same meeting entity.
- **Workspace policy affects specialist behavior**: **Verified via local rules**. The policy constraints (such as future due dates for actions) are checked by QA. If violated, they are passed as feedback constraints to specialists who then adjust their behavior (e.g., adding `dueDate: "2026-07-13T00:00:00.000Z"`).
- **Foreign tenant / workspace cannot access run memory**: **Verified**. The `InMemoryAgencyRunRepo` verifies `scopeMatch` checks for tenantId and workspaceId on every read (`get`, `list`, `getStep`, `listSteps`). Cross-tenant or cross-workspace access attempts fail or return `null` / `404`.

---

## Memory Durability Classification

| Memory Type | Duration | Persisted | Description |
| :--- | :--- | :---: | :--- |
| **Current-run context** | Single run execution | **No** (In-memory only) | Passed via local function parameter references. |
| **Cross-agent findings** | Lifetime of the run | **No** (In-memory only) | Accumulated in memory and kept until the run halts. |
| **Cross-task findings** | Ephemeral | **No** (In-memory only) | Reloaded from transient database mocks. |
| **Workspace policy** | Hardcoded rules | **No** (No DB tables) | Implemented as local rules in the `QAReviewerImpl`. |

> [!IMPORTANT]
> **Conclusion**: Memory is classified as **Non-durable (In-memory only)**. No state survives process restarts, Vercel cold starts, or new redeployments.
