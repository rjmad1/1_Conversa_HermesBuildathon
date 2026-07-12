# Known Limitations

> **Current-state notice:** Conversa is an active Buildathon prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

This document lists the architectural, security, and functional limits of the active Conversa codebase.

## 1. Architectural Limits
* **In-Memory Persistence Only**: The data store consists of volatile in-memory Maps (`in-memory.ts`). All meeting transcripts, actions, and audit logs are lost when the server restarts.
* **Serverless Scale Limitations**: The stateless backend fails to synchronize state across multiple serverless nodes. If deployed in a multi-instance Vercel Serverless environment, consecutive requests will route to different nodes, causing data mismatch.

## 2. Security Limits
* **Spoofable Header Scoping (BOLA Risk)**: Access scope relies entirely on incoming request headers (`x-tenant-id`, `x-workspace-id`) directly parsed into the user session context. There is no cryptographic verification or JWT validation. These caller-supplied headers do not constitute secure production credentials.
* **Log Redaction Scope**: Deep nested JSON logging objects are redacted recursively up to depth 10. However, values directly interpolated into log message strings will bypass the scanner and leak.

## 3. Integration Limits
* **No Partner Integrations**: No code exists for Slack, Jira, Salesforce, Teams, Zoom, Meet, Convex, ElevenLabs, Wispr Flow, or Linkup Search.
* **Batch-only Processing**: The system is incapable of processing streaming audio; audio ingestion runs post-meeting on complete audio files.

## 4. Key Disclosures
* **Production Authentication**: Production authentication is not implemented.
* **Demo Pathway**: The stable, tested path for the public demo uses a synthetic pasted transcript to avoid live audio upload timeouts or errors.
* **Compliance Audit**: Security regression tests pass, but the codebase has not undergone production-grade security certification or audit.
