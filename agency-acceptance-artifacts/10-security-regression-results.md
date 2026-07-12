# Security Regression Results

This document verifies the integrity of the security boundaries of the application and confirms zero regressions.

## Audit Matrix

| Security Check | Verified | Outcome | Evidence |
| :--- | :---: | :---: | :--- |
| **Cross-tenant run access** | **Yes** | **Blocked** | Returns `null` / `404` error in `InMemoryAgencyRunRepo` scope check. |
| **Cross-workspace run access** | **Yes** | **Blocked** | Returns `null` / `404` error in repository boundary verification. |
| **Cross-scope step access** | **Yes** | **Blocked** | Step retrievals assert scope match validation on `tenantId` and `workspaceId`. |
| **Cross-scope revision** | **Yes** | **Blocked** | Retrying steps asserts ownership of the target run and step scopes. |
| **Cross-scope approval** | **Yes** | **Blocked** | API rejects approvals/rejections of runs outside the active session identity. |
| **Trace input leakage** | **Yes** | **Redacted** | Transcript content is treated as confidential and not logged in global system streams. |
| **Token / cost metadata leakage** | **Yes** | **Redacted** | Pricing and usage metrics are isolated to authorized users' scoped API views. |
| **Escalation-detail leakage** | **Yes** | **Redacted** | Blockers are returned to authenticated workspace members only. |

---

## Vulnerability Scans

- **Secret Scanning**: **Pass**. Zero committed API keys, secrets, or environment credentials found in the codebase.
- **Dependency Audit (npm audit)**: **Pass (Dev-only warning)**. 5 vulnerabilities detected in local development dependencies (`esbuild`, `vitest`, `vite`), none present in runtime production dependencies (`hono`, `openai`, `zod`).
- **Adversarial Runner**: **Pass**. 7/7 isolation scenarios passed, verifying that cross-scope reads and mutations are safely rejected.
- **Smoke Test**: **Pass**. Verification smoke tests confirmed that wrong-tenant and wrong-workspace requests return 404.
