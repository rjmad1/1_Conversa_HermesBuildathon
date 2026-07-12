# Continuation Audit - Residual Risks

This document outlines the residual risks remaining in the stabilized Conversa repository.

## 1. Security Risks
* **Insecure Identity Adapter (`DevIdentityAdapter`)**: Scoping parameters are resolved from unvalidated headers (`x-tenant-id`, `x-workspace-id`). There is no cryptographic signature, password, or token verify. If exposed directly to production without a proxy or API gateway validating JWT signatures, it will allow tenant data spoofing.
* **No durable persistence**: Because all databases are in-memory Maps, they aresafe from SQL injection, but data will vanish on server cold-starts or sleep cycles.
* **Raw log message string formatting**: While the recursive redaction utility is robust on metadata objects, any developer formatting credentials directly into log message strings (e.g. `logger.info("Token: " + token)`) will bypass the JSON key scanner and leak secrets.

## 2. Functional and Operational Risks
* **Mock Ingestion Defaults**: The system uses `fake` default transcription. Testing real OpenAI pipelines is disabled in default test suites.
* **Zero External Syncing**: No partner integrations (Slack, Jira, Teams, Salesforce etc.) exist in the codebase.
* **Stateful Serverless Isolation Issues**: If Hono is scaled to multiple concurrent serverless nodes, requests will route to disjointed in-memory nodes, resulting in split-brain data states.
