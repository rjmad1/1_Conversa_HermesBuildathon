# Phase 08 - Residual Risks

This document catalogs the outstanding technical and security risks in this Conversa Buildathon snapshot.

## 1. Security Risks

* **Spoofable Identity Scoping (BOLA)**: The system relies strictly on request headers (`x-tenant-id` and `x-workspace-id`) to scope database partitions. Because there is no token validation, signature checks, or session verification, an attacker can easily bypass scoping by modifying these headers in the HTTP request payload.
* **String Logging Leakage**: The recursive log redactor scrubs deep JSON object keys. However, if a developer prints sensitive keys or credentials using string interpolation (e.g. `console.log("Key is: " + key)`), the values bypass the JSON parser and will leak in plaintext to stdout/stderr.
* **No Authentication**: The codebase contains no authentication (OAuth/JWT) system. It must not be deployed to public production environments without a protective API Gateway or JWT validation middleware layer.

---

## 2. Architectural & Functional Risks

* **State Disjointment (Split-Brain)**: Because all repositories store data in local, volatile in-memory Maps, deploying the application across multiple container replicas or Vercel serverless nodes will lead to data fragmentation. Consecutive HTTP requests routed to different serverless instances will receive different datasets.
* **Transcription Timeouts**: Ingesting raw audio and calling OpenAI Whisper API inside serverless edge routes is prone to timeouts (Vercel hobby tier has a 10-second cap). Large audio uploads will fail to finish before the execution timeout limit is reached.
* **Mocked Connectors**: Slack, Jira, and Salesforce integrations are mocks. Any workflow approval will log audit events but will not trigger real external API actions.
* **Data Loss on Reboot**: The volatile database storage is lost upon server restart or serverless function recycled instances.
