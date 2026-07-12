# Conversa — SRE / Operations (Audio-First)

**Author role:** SRE / Operations Lead
**Scope:** What we watch, how we recover, how we delete. MVP-pragmatic.

## 1. Monitoring & Alerting
- **Signals:** upload success rate, transcription latency p95, `415` rejection rate, tenant-isolation failures, provider error rate (OpenAI 401/429/500).
- **Alerts:** provider 429 (rate limit) → backoff; p95 transcription > timeout → page.
- **No raw audio in any log/metric/trace.**

## 2. Retention & Deletion (required by `docs/storage-security.md`)
- A **retention job** deletes `AudioAsset` + object after `AUDIO_RETENTION_DAYS`.
- Trigger: scheduled (cron) or on tenant deletion.
- Emit audit event on delete (no bytes logged).
- **If not built, audio accumulates forever** — explicitly out of MVP if time-boxed, but document the gap.

## 3. Incident Runbooks (MVP)
| Incident | Response |
| --- | --- |
| LLM outage (OpenAI down) | Graceful error; paste-transcript path still works for storage; queue transcription. |
| Rate limit (429) | Exponential backoff; surface "try later" to user. |
| Transcription timeout | Return 408; suggest shorter audio; retry path. |
| Auth issue (future) | RBAC deny; audit. |
| Storage failure | Fail upload; do not persist partial asset. |

## 4. DR
- Object store: cross-region copy (R2/S3 replica) if available.
- RPO/RTO: MVP best-effort; enterprise targets in `TechnicalNeeds.md`.

## 5. Cost
- Watch OpenAI Whisper + GPT-4 tokens per tenant.
- Cap per request; warn on oversize audio.

## 6. Open Ops Decisions
- Is retention job in MVP scope? If not, state the debt explicitly.
- Where do runbooks live for the demo? (This doc + dashboard.)
