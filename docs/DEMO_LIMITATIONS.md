# Demo Limitations

> **Current-state notice:** Conversa is an active MVP prototype. It contains incomplete, experimental, mocked, and security-remediation work. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

This document lists the limitations of the current demo environment.

## 1. What Not to Demonstrate

* **Real Audio Ingestion (Whisper)**: By default, the application is configured to run with `TRANSCRIPTION_PROVIDER=fake`. Demonstrating real audio uploads requires a configured and paid OpenAI API key in the environment variables. If clicked without an API key, transcription will fail or throw errors.
* **Persistent Cache**: All data resides in volatile in-memory repository arrays. Refreshing the browser or stopping the local terminal server will wipe out all meetings, transcripts, approvals, and audit events.
* **External System Syncing**: Claims regarding Slack integrations, Jira issue creation, and Salesforce updates represent future roadmap plans. There is no active code to sync actions or post messages.
* **Production Authentication**: Scoping runs on spoofable development request headers. There is no login flow, OAuth token parsing, or user validation.
