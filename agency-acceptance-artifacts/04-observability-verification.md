# Observability Verification

This document audits the observability features of the Conversa Agency Runs surface.

## Capability Assessment Matrix

| Capability | Present | Works publicly | Evidence |
| :--- | :---: | :---: | :--- |
| **Open a past run** | **Yes** | **Yes** | Select from runs table via `data-open-run` event listener, which calls `fetchRunDetails(runId)` to fetch `/api/v1/agency/runs/:runId`. |
| **View every step** | **Yes** | **Yes** | Inside trace details screen, steps are dynamically rendered in the `.trace-tree` container. |
| **View parent/child relationships** | **Yes** | **Yes** | Steps list is ordered chronologically by `startedAt` and includes `parentStepId` properties internally. |
| **View agent role** | **Yes** | **Yes** | Step headers display `step.agentRole` (e.g. `DECISION SPECIALIST`). |
| **View latency per step** | **Yes** | **Yes** | Calculated in UI: `new Date(step.completedAt) - new Date(step.startedAt)` and displayed in milliseconds. |
| **View token counts** | **Yes** | **Yes** | Displays step input/output token counts (e.g., `10/50`). |
| **View estimated cost** | **Yes** | **Yes** | Cost calculated on the backend via pricing heuristics and rendered in UI (e.g., `$0.0000`). |
| **View revision count** | **Yes** | **Yes** | Displays `Revisions: {step.revisionCount}` next to step details. |
| **View escalation reason** | **Yes** | **Yes** | Displays `Escalation Blocker: {step.escalationReason}` in a prominent warning card if a step status is `ESCALATED`. |
| **Filter by agent** | **Yes** | **Yes** | `/api/v1/agency/runs?agentRole={role}` query param filtering is wired to the list view dropdowns. |
| **Filter by run status** | **Yes** | **Yes** | `/api/v1/agency/runs?status={status}` is fully supported at the API repo query level. |
| **Compare two runs side by side** | **Yes** | **Yes** | CompDiv renders side-by-side dropdown selectors and invokes `renderSideBySideComparison(idA, idB)` to produce comparative metrics table. |

---

## Trace Durability Classification

> [!WARNING]
> **Storage Classification**: **In-memory only (Non-durable)**
>
> **Restart Survival Check**:
> - **Does trace survive local process restart?** **No**.
> - **Does trace survive Vercel cold start?** **No**.
> - **Does trace survive redeployment?** **No**.
>
> **Rationale**: All runs and steps are stored in the memory-only maps of `InMemoryAgencyRunRepo`. Therefore, they do not persist across server restarts or Vercel instance recycles. Traces must be classified as in-memory only.
