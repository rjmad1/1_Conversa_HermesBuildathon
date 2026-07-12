# AI Agency Architecture

This wiki page describes the dynamic multi-agent meeting analysis agency in Conversa.

For detailed specifications, see [AI_AGENCY_ARCHITECTURE.md](../AI_AGENCY_ARCHITECTURE.md).

## Core Design
- **Crew Orchestration**: Bounded roles (Meeting Manager, Decision Specialist, Risk Specialist, Action Specialist, QA Reviewer).
- **Handoff Memory**: Explicit context transfer via `AgentHandoff` envelopes.
- **Manual Gates**: Conditionally pauses for human review before finalizing analysis.
- **Audit Logs**: Events generated for plan creation, execution starts/finishes, revisions, and approvals.
