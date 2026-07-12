# Conversa — Non-Functional Requirements (Audio-First)

**Author role:** Solution Architect
**Audience:** Builders + SRE. Targets are MVP-pragmatic, not enterprise-final (see `TechnicalNeeds.md` for full enterprise NFRs).

## 1. Performance

| Metric | Target (MVP) | Notes |
| --- | --- | --- |
| End-to-end (upload→transcript visible) | < 30s for ≤10MB audio | Whisper latency dominates; not the <3s real-time target (real-time deferred). |
| Agent suggestions after processing | < 15s | GPT-4 extraction. |
| Upload progress | streamed to UI | fetch progress. |

- **Function timeout risk:** Vercel Pro = 60s. A 10MB MP3 can exceed 60s to transcribe. Mitigation: cap input duration, or move transcription to a background/queued job, or use Cloudflare with longer limits. **Decide before build** (see `docs/deployment.md`).

## 2. Scalability

- MVP: single-instance serverless; concurrency not a hard gate.
- Design: stateless ingestion; tenant-scoped storage permits horizontal scale later.

## 3. Security

- TLS 1.3 in transit; encryption at rest for stored audio.
- RBAC where auth exists; BYOK keys never stored server-side.
- **Raw audio never in logs** (only `assetId` + `status`).
- Opaque, tenant/workspace-scoped `storageReference`.
- Video rejected at boundary (no video processing surface).

## 4. Compliance

- MVP: no PII special handling beyond encryption + retention.
- Path to SOC 2 / GDPR via tenant isolation + audit (see `TechnicalNeeds.md`).

## 5. Accessibility (WCAG 2.1 AA for primary flow)

- Audio upload + paste transcript both fully keyboard operable.
- ARIA labels on inputs, progress, errors.
- No camera/webcam prompts (also a scope rule).
- Provide text alternatives for audio-only guidance (format/size help text).

## 6. Reliability / DR

- MVP: provider-outage = graceful error + retry UI.
- Retention + deletion via job (see `docs/sre-ops.md`).

## 7. Observability

- Structured logs (no raw audio), metrics, tracing.
- Key signals: upload success, transcription latency, `415` rejection rate, tenant-isolation failures.

## 8. Maintainability

- Modular; clear service boundaries; tests per `docs/test-plan.md`.
- Documentation is the contract; keep `docs/INDEX.md` current.

## 9. Constraints (hard)

- Audio ≤ `AUDIO_MAX_BYTES` (10MB default), ≤ `AUDIO_MAX_SECONDS` (7200 default).
- Formats: MP3 / WAV / M4A only.
- No video, no camera.
