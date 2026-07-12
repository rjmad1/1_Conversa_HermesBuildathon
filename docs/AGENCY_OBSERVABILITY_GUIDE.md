# Agency Observability Guide

This document describes how to monitor and query multi-agent execution runs in Conversa.

## Trace Records

Every run creates a parent `AgencyRun` record:
- **Run ID**: Unique run trace key.
- **Started / Completed timestamps**: Precise run duration tracking.
- **Latency (ms)**: Per-agent and total execution time.
- **Tokens (In/Out)**: Aggregated tokens consumed by specialists and QA.
- **Estimated Cost**: Dollar cost calculated dynamically using rates from `src/shared/observability/model-pricing.ts`.

And child `AgencyStep` records for each specialist:
- **stepId**
- **parentStepId**: Links child trace steps.
- **agentRole**: Role of the executing agent.
- **sanitizedInputSummary / sanitizedOutputSummary**: Summaries ensuring no raw transcript or credentials leak.
- **revisionCount**: Number of times the step went through revision.
- **errorCode / escalationReason**: Details of errors or human escalations.

## Observability UI

On the **Agency Runs** page, you can:
- **List and Filter**: Filter runs by status (RUNNING, COMPLETED, PAUSED, ESCALATED) or agent role.
- **Inspect Trace Tree**: View parent-child trace trees, latencies, and costs per step.
- **Compare Side-by-Side**: Select two runs from the comparison selectors and view a side-by-side table comparing their latency, tokens, cost, and extracted entities.
