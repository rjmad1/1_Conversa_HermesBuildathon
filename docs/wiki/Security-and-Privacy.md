# Security and Privacy

> **Current-state notice:** Conversa is an active MVP prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

This page covers security policies, tenant isolation, and logging confidentiality.

---

## 1. Multi-Tenancy Scoping (BOLA Mitigation)
Conversa enforces multi-tenancy boundaries at the repository layer.
* All queries check `tenantId` and `workspaceId` parameters.
* Requesting an item belonging to another tenant returns `null` or throws a non-disclosing `NOT_FOUND` error.
* Session context variables are populated via middleware parsing incoming request headers (`x-tenant-id`, `x-workspace-id`).

> [!WARNING]
> Caller-supplied development headers are not production credentials. They are spoofable.

---

## 2. Recursive Log Redaction
The application implements console log scrubbing:
* Log objects undergo deep recursive scrubbing up to 10 nesting levels.
* Keys matching `key`, `token`, `secret`, `authorization`, `password`, or `audio` are replaced with `[REDACTED]`.
* Circular references are handled by emitting `[CIRCULAR]`.

---

## 3. Disclosures & Remediation Audit
* **Security Audit Status**: All security regression tests pass. Tenant isolation boundaries are closed and verified.
* **Authentication**: Production authentication is not implemented.
* **Vulnerability Reports**: Please report vulnerabilities privately. Refer to `SECURITY.md` in the repository root.
