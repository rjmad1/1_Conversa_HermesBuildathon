# Five-Minute Demo Script

## 0:00–0:30 — Problem framing
Meeting outputs are often non-operational: context is captured, actionability is not.

## 0:30–1:10 — Product framing
Conversa focuses on governed action creation, not just summarization.
Current architecture: Vite UI + Hono API + in-memory repos + provider abstraction.

## 1:10–2:10 — Live walkthrough
- create meeting context
- submit synthetic transcript
- run analysis
- inspect decisions/risks/actions

## 2:10–3:00 — Governance walkthrough
- approve first action
- reject second action with reason
- verify audit timeline

## 3:00–3:40 — Security walkthrough
- try wrong-tenant analysis read
- try wrong-workspace read
- try foreign action mutation
- show non-disclosing denied behavior

## 3:40–4:20 — Verification evidence
- point to remediation evidence: 56/56 tests at verified checkpoint
- adversarial runner pass
- smoke test pass
- note explicit prototype limitations

## 4:20–5:00 — Roadmap + business value
- pilot hardening path (auth, durable store, one connector)
- expected operational value from reduced manual follow-up effort
- transparent close: prototype status, no overclaim
