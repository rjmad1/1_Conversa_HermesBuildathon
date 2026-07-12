# Known Limitations

> **Current-state notice:** Conversa is an active Buildathon prototype. It contains incomplete, experimental, mocked, and security-remediation work. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

This document lists the architectural, security, and functional limits of the active Conversa codebase.

## 1. Architectural Limits
* **In-Memory Persistence Only**: The data store consists of volatile in-memory Maps (`in-memory.ts`). The database configuration keys (`d1`, `r2`) are not wired in the repository factory.
* **Serverless Scale Limitations**: The stateless backend fails to synchronize state across multiple serverless nodes. If deployed in a multi-instance Vercel Serverless environment, consecutive requests will route to different nodes, causing data mismatch.

## 2. Security Limits
* **Spoofable Header Scoping (BOLA Risk)**: Access scope relies entirely on incoming request headers (`x-tenant-id`, `x-workspace-id`) directly parsed into the user session context. There is no cryptographic verification or JWT validation.
* **Shallow Log Redaction Limitation**: Deep nested JSON logging objects are redacted recursively. However, values directly interpolated into log message strings will bypass the scanner and leak.

## 3. Integration Limits
* **No Partner Integrations**: No code exists for Slack, Jira, Salesforce, Teams, Zoom, Meet, Convex, ElevenLabs, Wispr Flow, or Linkup Search.
* **Batch-only Processing**: The system is incapable of processing streaming audio; audio ingestion runs post-meeting on complete audio files.
