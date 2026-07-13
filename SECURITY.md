# Security Policy

---
### 📋 Document Metadata
- **Purpose**: Public security disclosures, reporting process, and baseline controls.
- **Audience**: Customers, auditors, developers, and security engineers.
- **Last Generated**: 2026-07-13T05:20:47+05:30
- **Confidence Level**: High (Verified by Vitest security regression suites).
- **Evidence Used**: Centralized middleware (`authGuard`), body limits, rate limits.
- **Cross References**: See [PRODUCTION_READINESS.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/PRODUCTION_READINESS.md) for architecture.
- **Open Questions**: Rotation guidelines for static Bearer Tokens.
- **Known Limitations**: Ephemeral storage makes forensic analysis difficult.
- **Recommended Next Actions**: Enforce TLS and HTTPS verification at deployment gateway.
---

## Product Security Status

> **Current-state notice:** Conversa is an active Buildathon prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

Although Conversa is an experimental Buildathon prototype, we take security seriously and have conducted runtime security audits and tenant isolation hardening. All security regression tests pass.

## Reporting a Vulnerability

Please do not open public GitHub issues for security vulnerabilities. Instead, report any security concerns directly to the project owner by emailing `rajaj@example.com` (or the repository administrator).

When reporting, please include:
- A detailed description of the issue.
- Step-by-step instructions to reproduce the vulnerability (proof-of-concept).
- Potential impact and remediation suggestions.

We will review your submission and respond within 48 hours.

## Hard Security Rules in the Codebase

* **Opaque Storage References**: Raw audio filenames are hashed and scoped under tenant/workspace identifiers.
* **No Raw Audio in Logs**: Raw audio payloads are completely excluded from log sinks.
* **Recursive Redaction**: Log payloads undergo JSON redaction up to depth 10 to filter out sensitive credentials or API keys.
* **Tenant Isolation**: Strict logical tenant and workspace boundaries are enforced in memory.
* **Authentication Adapter**: Production mode strictly enforces server-side `ProdIdentityAdapter` using Bearer Tokens. Dev headers are blocked in production.
* **Centralized Authorization**: central `authGuard` role checks on all mutating API calls.
* **Resource Constraints**: Pre-parsing request content-length checks matching `AUDIO_MAX_BYTES` (10MB) prevent DDoS/exhaustion.
