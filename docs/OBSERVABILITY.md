# Conversa — Observability & Telemetry Architecture

---
### 📋 Document Metadata
- **Purpose**: Specifies structured logging schemas, JSON redaction rules, token-cost metrics, liveness/readiness indicators, and operational dashboards.
- **Audience**: Site reliability engineers (SREs), DevOps, security officers, and administrators.
- **Last Generated**: 2026-07-13T05:20:47+05:30
- **Confidence Level**: High (Grounded in `logger.ts`, `health.ts`, and model-pricing helpers).
- **Evidence Used**: Logger configuration, health checks, and model pricing tables.
- **Cross References**: See [ARCHITECTURE.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/ARCHITECTURE.md), [EVENTS.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/EVENTS.md), [TROUBLESHOOTING.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/TROUBLESHOOTING.md).
- **Open Questions**: Centralized APM platform integration (Datadog vs. Grafana/Loki).
- **Known Limitations**: logs are synchronous; metrics are calculated in-memory without persistent aggregators.
- **Recommended Next Actions**: Enforce TLS and HTTPS verification at deployment gateway.
---

## 1. Structured Logging & Privacy Redaction

### 1.1 Logger Configuration
The platform implements a structured `AppLogger` that emits JSON logs to standard output streams.
Every log entry contains the following standard structure:
```json
{
  "ts": "2026-07-13T05:20:47.158Z",
  "level": "info",
  "msg": "meeting created",
  "operation": "CreateMeeting",
  "correlationId": "uuid-string",
  "outcome": "success"
}
```

### 1.2 Recursive Privacy Redaction (`redact`)
To prevent accidental leakage of PII, credentials, or API keys:
- All logging payloads undergo recursive JSON redaction up to depth 10.
- Sensitive fields (such as `apiKey`, `Authorization`, `password`, `token`) are automatically scrubbed or replaced with `[REDACTED]`.
- **Raw audio data** is excluded from log inputs.

---

## 2. Telemetry & AI Token Cost Estimation

### 2.1 Model Rate Matrix
Pricing estimations are calculated in real-time inside `model-pricing.ts` based on:
- **OpenAI GPT-4o**: $0.005 / 1K input tokens, $0.015 / 1K output tokens.
- **OpenAI GPT-4o-Mini**: $0.00015 / 1K input tokens, $0.0006 / 1K output tokens.
- **Fake Provider**: $0.0 / 1K tokens.

### 2.2 Cost Tracking Logic
Every agent execution run tracks `totalInputTokens` and `totalOutputTokens`, calculating the aggregate estimated cost. This cost is returned on the trace endpoint (`GET /api/v1/agency/runs/:runId`) and displayed in the frontend dashboard.

---

## 3. Health & Readiness Checks

The platform exposes two standard endpoints under `/api/health/*` that bypass role check gates:

* **Liveness Probe (`GET /api/health/live`)**:
  * Confirms the Node or Worker process is running and reachable.
  * Returns version and git commit hash.
  * Payload:
    ```json
    { "live": true, "version": "0.3.0", "commit": "d21bab3" }
    ```

* **Readiness Probe (`GET /api/health/ready`)**:
  * Evaluates health status of downstream dependencies (persistence stores, API providers).
  * Payload:
    ```json
    {
      "status": "ok",
      "live": true,
      "ready": true,
      "details": { "persistence": true }
    }
    ```
