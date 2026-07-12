# Agency Evaluation Guide

This document describes the automated evaluation pipeline for Conversa's multi-agent meeting analysis agency.

## Running the Evaluation

Execute the evaluation gate locally or in CI using:
```bash
npm run eval:agency
```

This runs 25 test cases defined under `evaluation/meeting-agency-v1/cases.ts` and asserts quality thresholds.

## Gate Thresholds

- **Decision Recall**: >= 80%
- **Risk Recall**: >= 80%
- **Action Recall**: >= 80%
- **Owner Accuracy**: = 100%
- **Date Accuracy**: >= 95%
- **Hallucinated Owners**: = 0
- **Hallucinated Dates**: = 0
- **Cross-tenant security failures**: = 0

## Case Coverage

The evaluation set covers 25 distinct scenarios:
1. Clear decisions, risks, actions.
2. Ambiguous owners.
3. Missing due dates.
4. Conflicting dates.
5. No decisions (skipped specialist).
6. No risks (skipped specialist).
7. No actions (skipped specialist).
8. Multiple owners.
9. High-risk approval requirements.
10. Hallucination traps.
11-12. Adversarial wrong scope access attempts.
13. Malformed inputs.
14. Extremely long transcripts.
15. Repeated statements.
16. Contradictory statements.
17. Policy violations requiring automatic revision.
18. Unresolved ambiguities causing escalation.
19-25. Various single-role extractions and date variations.
