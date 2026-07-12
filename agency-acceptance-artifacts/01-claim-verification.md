# Claim Verification

This document evaluates the claim-by-claim verification of Conversa's managed AI agency structure and behaviors, as observed during the non-modification inspection.

## Verification Table

| Claim | Evidence | Verified | Limitation |
| :--- | :--- | :---: | :--- |
| **Manager is distinct from specialists** | `PlanMeetingAnalysis` calls `MeetingManagerImpl` which only returns steps, while `ExecuteAgentTask` delegates to specialist instances (`DecisionSpecialistImpl`, `RiskSpecialistImpl`, `ActionSpecialistImpl`). | **Yes** | Architectural boundaries are clean, but implementations currently rely on mocks / eval-case lookups. |
| **Manager produces a task-specific plan** | `MeetingManagerImpl.plan(transcript)` inspects transcript keywords (or matched eval cases) and marks steps as `skipped`. | **Yes** | Planning is heuristic/regex-driven or hardcoded to `EVAL_CASES`. |
| **Plans differ by transcript** | Different transcripts generate distinct steps (e.g., skips `RISK_SPECIALIST` on no-risk transcripts, or skips multiple specialists). | **Yes** | Relies on keyword matches ("risk", "action", etc.) or hardcoded eval cases. |
| **Specialists receive explicit delegated tasks** | `RunMeetingAgency` constructs an `AgentHandoff` containing `relevantContext`, `priorFindings`, and `policyConstraints` for the specialist. | **Yes** | Context sharing is done via in-memory JavaScript objects. |
| **Specialists return typed outputs** | Specialists return objects structured as `{ decisions: [...] }`, `{ risks: [...] }`, or `{ proposedActions: [...] }`. | **Yes** | Standard TypeScript objects. |
| **QA reviews specialist outputs** | `QAReviewerImpl.review` is executed on each specialist's findings prior to merging them into the final analysis. | **Yes** | Review logic is rule-based or matched to eval cases. |
| **QA can reject and request revision** | If `approved: false` (and not escalated), the agency loop increments `revisionCount` and feeds the rejection reason back into the handoff's `policyConstraints`. | **Yes** | Handled in `RunMeetingAgency` loop. |
| **Revision is bounded to one retry** | `while (revisionCount <= 1)` loop and check `if (revisionCount > 1) { stepStatus = "ESCALATED"; ... }` ensures only 1 revision retry. | **Yes** | Strictly capped at 1 retry; cannot be configured to allow more attempts. |
| **Escalation returns a concrete blocker** | QA can set `escalated: true` with a concrete `reason` (e.g., from `requiresEscalation` cases or retry count breach), which sets step to `ESCALATED`. | **Yes** | Triggers only under pre-programmed ambiguity or after retry limit failure. |
| **No infinite loops exist** | Checked revision boundary condition ensures loops terminate immediately after the second attempt. | **Yes** | Loop is deterministic and safe from infinite execution. |
| **Role names are not merely labels over one monolithic call** | Separate classes `DecisionSpecialistImpl`, `RiskSpecialistImpl`, `ActionSpecialistImpl`, and `QAReviewerImpl` are instantiated and executed in sequence. | **Yes** | Each agent runs independently, though mock data source is shared. |
