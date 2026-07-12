# FAQ for Judges

1. **What problem does Conversa solve?**
   - It converts meeting content into structured, approval-gated actions with auditability.
2. **How is this different from a summarizer?**
   - Conversa focuses on governed actions and approvals, not summary-only output.
3. **What works today?**
   - Transcript analysis, decisions/risks/actions extraction, approval/rejection, audit trail, isolation checks.
4. **What is mocked?**
   - Core persistence is in-memory; several downstream integrations are planned/partial.
5. **Why use pasted transcript in demo?**
   - It is the most stable and deterministic path for judge sessions.
6. **How does tenant isolation work?**
   - Request scope is enforced at repository boundaries and validated in adversarial/smoke tests.
7. **What happens before action execution?**
   - Human approval/rejection is required.
8. **Which integrations are live?**
   - Vercel-hosted prototype path is available; major enterprise connectors are not fully verified as complete in this slice.
9. **Is it production-ready?**
   - No. Prototype Buildathon snapshot.
10. **How was it tested?**
   - Unit, integration, E2E, adversarial runner, smoke verification artifacts.
11. **What did the audit discover?**
   - Isolation and related boundary defects that were remediated.
12. **How were findings remediated?**
   - Scoped repository/use-case fixes + regression/adversarial coverage + verification evidence.
13. **What is next?**
   - Pilot hardening: auth, durable storage, one verified integration, observability.
14. **How would this make money?**
   - Team/department subscription model tied to workflow automation value and governance controls.
15. **Most important product metric?**
   - Action completion rate from meeting-derived tasks (with governance-quality guardrails).
