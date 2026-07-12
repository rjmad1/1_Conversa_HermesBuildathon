# Final Acceptance Artifact 08: Residual Risks

This document outlines the residual risks remaining in the Conversa Buildathon prototype.

## Staged Deployment Residual Risks

### 1. Volatile In-Memory Persistence
- **Description:** All database repositories and media storage objects remain strictly in-memory (`InMemoryAudioStorage` and in-memory repository classes).
- **Risk Level:** **HIGH** for production; **LOW** for demonstration.
- **Remediation Plan:** Replace memory structures with durable SQL database connections and S3/R2 object storage adapters in the next phase.

### 2. Prototype Development Authentication Fallback
- **Description:** The `DevIdentityAdapter` was modified to allow execution in Vercel deployments when explicitly in non-production authentication mode (relying on raw request headers `x-tenant-id` and `x-workspace-id`).
- **Risk Level:** **HIGH** for production; **LOW** for prototype review.
- **Remediation Plan:** Replace header-based identity extraction with a cryptographically verified JSON Web Token (JWT) resolver or session-cookie auth handler before any multi-tenant rollout.

### 3. Partial and Conceptual Integrations
- **Description:** Integrations with Jira, Salesforce, HubSpot, and Slack remain partial, conceptual, or stubbed out behind providers.
- **Risk Level:** **MEDIUM**.
- **Remediation Plan:** Integrate third-party OAuth flows and implement real HTTP client connectors for these downstream services.
