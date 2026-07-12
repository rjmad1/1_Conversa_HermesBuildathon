# Security and Privacy

This page covers multi-tenancy boundaries and logging confidentiality details.

## 1. Multi-Tenancy Scoping (BOLA Mitigation)
Repository queries enforce multi-tenancy boundaries:
* All reads and updates check matching `tenantId` and `workspaceId` parameters.
* Unauthorized cross-tenant queries return `null` or throw non-disclosing `MEETING_NOT_FOUND` / `NOT_FOUND` 404 errors.

## 2. Recursive Redaction
Logs are recursively sanitized before write:
* Detects sensitive keys (e.g., API keys, raw transcripts, storage references) and replaces them with `[REDACTED]`.
* Detects circular references and logs `[CIRCULAR]`.
* Cuts off nested logging at depth 10 with `[MAX_DEPTH_REACHED]`.

For details, see [SECURITY_AND_PRIVACY](file:///c:/Users/rajaj/Projects/1_Conversa/docs/SECURITY_AND_PRIVACY.md).
