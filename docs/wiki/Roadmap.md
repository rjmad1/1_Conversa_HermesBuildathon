# Roadmap

> **Current-state notice:** Conversa is an active MVP prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

Future development roadmap for Conversa:

## Phase 1: Security & Identity (Short-Term)
* **Production Authentication**: Replace caller-supplied headers with JWT/OAuth2 mechanisms (e.g. Auth0, Clerk).
* **Cryptographic Tenant Isolation**: Digitally sign and verify tenant/workspace scopes.

## Phase 2: Core Infrastructure (Medium-Term)
* **Persistent DB**: Transition from volatile in-memory Maps to a durable DB (e.g., PostgreSQL or Cloudflare D1 SQLite).
* **Object Storage**: Integrate Cloudflare R2 or AWS S3 for secure audio file uploads.
* **Large File Streaming**: Implement chunked streaming uploads to prevent timeouts.

## Phase 3: Integration Connectors (Long-Term)
* **Jira Link**: Connect actual Jira Cloud APIs for automatic ticket creation.
* **Slack Webhooks**: Push alerts and interactive approval blocks to Slack channels.
* **Video Extension**: Implement video ingestion and multi-modal analysis (per ADR 0002).
