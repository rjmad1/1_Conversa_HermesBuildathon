# Residual Risks & Verification Exclusions

This document defines any residual risks, testing limitations, or architectural assumptions remaining after the closure of the security remediation pass.

## Scopes & Residual Risks

### 1. Development-Only Identity Headers
* **Description**: The Hono app reads client-supplied headers `x-tenant-id` and `x-workspace-id` via `DevIdentityAdapter` to resolve multi-tenancy parameters.
* **Risk**: If `DevIdentityAdapter` is activated in production, any caller can spoof tenant identities.
* **Remediation Guard**: The adapter throws a fatal error in the constructor if `AUTH_MODE === "prod"` or `process.env.NODE_ENV === "production"`, failing closed at boot.
* **Residual Risk**: Production deployments must explicitly configure an authenticated identity adapter that extracts tenant/workspace scopes from verified cryptographically signed claims (e.g. JWT tokens) rather than raw headers.

### 2. In-Memory Persistence Limitations
* **Description**: Scoping enforcement is built on the in-memory map repositories.
* **Risk**: When swapping to Cloudflare D1 or physical relational engines, scoping SQL statements must replicate these exact constraints.
* **Residual Risk**: Any subsequent SQL database adapter must enforce row-level security (RLS) or add explicit `WHERE tenant_id = ? AND workspace_id = ?` clauses.

### 3. Third-Party Provider Integration Contracts
* **Description**: The transcription provider's integration uses standard mocks and local audio byte buffers for verification.
* **Risk**: We have not run live network calls against the OpenAI Whisper API in this testing run.
* **Residual Risk**: Submitting massive audio files may hit OpenAI's 25MB limits or timeout. Proper file chunking must be implemented if production media assets exceed this threshold.

### 4. Parallel HERMES Stream Overlaps
* **Description**: Pre-existing changes to provider interfaces were integrated from the HERMES stabilization efforts.
* **Risk**: If the parallel HERMES stream subsequently modifies app routers or use cases, they must preserve the scope check parameters.
* **Residual Risk**: Future merges must ensure repository calls always propagate tenant and workspace scopes as their first arguments.
