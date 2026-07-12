# Phase 4 - Residual Risks Disclosure

This document discloses all unresolved security, functional, and operational risks identified during the Conversa publication readiness audit.

## 1. Security & Privacy Risks

* **Spoofable Developer Identity (BOLA/Auth Leak)**: The identity layer resolves user context (`tenantId`, `workspaceId`) from plain HTTP headers (`x-tenant-id`, `x-workspace-id`) without validation. If the application is deployed directly to a public Vercel or Cloudflare Worker route without a gateway validating JWTs, attackers can spoof these headers to access any tenant's data.
* **Lack of Data Transmission Protection (TLS/CORS)**: The application does not enforce HTTPS checks or perform rigorous CORS origin whitelist validation in the code, relying entirely on the hosting provider to handle transport security and cross-origin security.
* **Deep Logger Leakage through Message Interpolation**: While the `redact` utility is applied to metadata objects in structured logs, any developer interpolating sensitive parameters directly into message strings (e.g. `logger.info(..., "Uploaded key: " + apiKey)`) will bypass the key-matching scanner and leak secrets into the logging stream.
* **Uncontrolled Third-Party AI Data Logging**: If standard OpenAI providers are enabled, transcripts are dispatched directly to OpenAI APIs. The application lacks filters to prevent OpenAI from logging or training on the data.

## 2. Functional Risks

* **Total Data Ephemerality**: All repository data (meetings, transcripts, analyses, approvals, audit logs) is stored in volatile, in-memory Maps. Any server crash, restart, scale-down, or serverless cold start (functions sleeping) will immediately erase all records.
* **Mocked Transcription & Analysis defaults**: The default configuration operates on hardcoded text payloads. The system does not possess real transcription logic except for standard OpenAI integration, which requires external API keys.
* **Broken Integrations Claims**: Zoom, Teams, Google Meet, Slack, Jira, Salesforce, and other integrations mentioned in product requirements do not exist in the codebase.

## 3. Operational Risks

* **Untested Serverless Scaling Portability**: While `worker.ts` exists for Cloudflare Worker entry, it has not been tested in live worker isolates. Additionally, because Hono backend instances are stateful (relying on in-memory Maps), scaling the application to multiple concurrent serverless nodes will result in split-brain state issues, where different requests land on different nodes containing disjointed data.
* **Shallow Observability**: There are no dashboards, performance metrics, alert definitions, or tracing hooks. Only raw JSON console logs are written.
