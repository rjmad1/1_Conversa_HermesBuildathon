# Judge Walkthrough

## Prerequisites
- Public app link (Antigravity-verified)
- Public repository link (Antigravity-verified)
- Optional wiki link (Antigravity-verified)
- Synthetic transcript from `22-demo-transcript.md`

## Step-by-step
1. Open app.
2. Create meeting / load demo context.
3. Paste synthetic transcript.
4. Run analysis.
5. Review decisions, risks, actions.
6. Approve one action; reject one action.
7. Open audit trail and show event chronology.
8. Narrate security checks and evidence index.

## Expected responses
- Transcript submit: success
- Analysis: structured output with decisions/risks/actions
- Approve/reject: success with updated state
- Wrong-scope checks: denied/non-disclosing

## What not to demonstrate
- Live external writes to Jira/Slack/Salesforce as "complete"
- Production auth claims
- Regulated-data readiness claims

## Recovery if live AI path fails
- Use synthetic transcript stable path.
- If model endpoint unstable, switch to static expected outputs (`23-demo-expected-output.md`).

## Recovery if Vercel unavailable
- Switch to Level B or C backup plan (`24-backup-demo-plan.md`).

## Closing narrative
Conversa demonstrates governed meeting-to-action conversion with isolation and auditability in a transparent prototype scope.
