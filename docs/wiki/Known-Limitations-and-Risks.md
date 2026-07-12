# Known Limitations and Risks

This page outlines the current limitations, out-of-scope features, and residual risks in this release.

## 1. Architectural Limitations
* **Volatile Memory**: All data is saved inside volatile in-memory Maps. Any server restart or serverless cold-start wipse out all records.
* **Serverless Scaling Split-Brain**: Since the server is stateful but instances are isolated, running multiple serverless instances concurrently will result in split disjointed datasets.

## 2. Security Risks
* **Spoofable Headers (Unsecured Identity)**: Scoping is parsed directly from headers (`x-tenant-id`, `x-workspace-id`) without validation signatures or tokens.
* **Logger Leaks**: Logger redacts JSON key-value pairs recursively. However, values directly concatenated into log messages strings bypass redactions.

For details, see [KNOWN_LIMITATIONS](file:///c:/Users/rajaj/Projects/1_Conversa/docs/KNOWN_LIMITATIONS.md).
