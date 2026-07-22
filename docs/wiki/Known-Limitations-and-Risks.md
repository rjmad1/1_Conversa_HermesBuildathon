# Known Limitations and Risks

> **Current-state notice:** Conversa is an active MVP prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

This page outlines the current limitations, out-of-scope features, and residual risks in this release.

## 1. Architectural Limitations
* **Volatile Memory**: All data is saved inside volatile in-memory Maps. Any server restart or serverless cold-start wipes out all records.
* **Serverless Scaling Split-Brain**: Since the server is stateful but instances are isolated, running multiple serverless instances concurrently will result in split disjointed datasets.

## 2. Security Risks
* **Spoofable Headers (Unsecured Identity)**: Scoping is parsed directly from headers (`x-tenant-id`, `x-workspace-id`) without validation signatures or tokens.
* **Logger Leaks**: Logger redacts JSON key-value pairs recursively. However, values directly concatenated into log messages strings bypass redactions.

## 3. Disclosures & Demo Risks
* **Demo Pathway**: The pasted transcript path is the only fully verified and stable path. Direct audio upload may trigger serverless execution timeouts (10s on Vercel Hobby, 60s on Vercel Pro) during transcription.
* **No Authentication**: Caller-supplied development headers are not production credentials.
