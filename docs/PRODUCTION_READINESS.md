# Conversa Production Readiness & Security Architecture

This document outlines the security controls, remediation architectures, and operational gates implemented to secure the Conversa prototype for production-readiness, while keeping the prototype runtime lean and serverless-friendly.

---

## 🔐 1. Authentication & Tenant Identity Resolution

### Production Identity Adapter (`ProdIdentityAdapter`)
In production (`NODE_ENV=production`), Conversa ignores untrusted, caller-supplied identity headers (`x-tenant-id`, `x-workspace-id`, `x-actor-id`). Instead, it enforces token-based authentication:
- **Header format**: `Authorization: Bearer <token>`
- **Token mapping**: Incoming tokens are validated against the `PROD_AUTH_TOKENS` configuration map (configured via server-side environment variables).
- **Role resolution**: Evaluated server-side, mapping validated tokens to roles (`admin`, `approver`, `viewer`).
- **Workspace Scoping**: Production callers are locked to the server-configured workspace, preventing tenant boundaries bypass.

### Development Identity Adapter (`DevIdentityAdapter`)
In development or testing environments:
- Headers are processed to support local and simulated multi-tenancy verification.
- **Critical Safety Guard**: If `NODE_ENV=production` is detected, or if `ALLOW_DEV_IDENTITY` is not explicitly set to `"true"`, the dev adapter throws a fatal boot error to prevent accidental exposure of raw headers in production.

---

## 🛡️ 2. Role-Based Access Control (RBAC)

A centralized authorization middleware (`authGuard`) intercepts all routes under `/api/v1/*` (except public health checks) and enforces the following privileges:

| Role | Permitted HTTP Methods | Description |
| --- | --- | --- |
| **Viewer** | `GET` | Read-only access to meetings, analysis, and audits. Prohibited from creating/updating/deleting. |
| **Approver** | `GET`, `POST`, `PUT`, `DELETE` | Full operational workflow access (meeting creation, audio ingestion, transcript submission, analysis runs, approving/rejecting actions). Prohibited from resetting workspaces. |
| **Admin** | `GET`, `POST`, `PUT`, `DELETE` | All operational workflow privileges plus the administrative ability to trigger workspace resets. |

---

## 🌐 3. Network & Content Protection Middlewares

### CORS Origin Restriction
In production, only origins configured under the `ALLOWED_ORIGINS` comma-separated list are permitted. Standard CORS options (credentials, methods, allowed headers) are strictly enforced, and unknown origins are rejected with `403 Forbidden`.

### Security Headers (CSP, HSTS, Frame Restriction)
Every API response serves strict headers:
- **Content-Security-Policy (CSP)**: Restrictions preventing unsafe scripts and framing.
- **X-Frame-Options**: Set to `DENY` to mitigate Clickjacking.
- **X-Content-Type-Options**: Set to `nosniff`.
- **Strict-Transport-Security (HSTS)**: Configured with `max-age=31536000; includeSubDomains`.
- **X-Robots-Tag**: Enforces `noindex, nofollow` to prevent search engine indexing of the prototype endpoint.

---

## 📦 4. Resource Exhaustion & Payload Controls

### Request Body Limit Protection
- **Non-audio endpoints**: Capped at `2MB` payload size.
- **Audio ingestion**: Limits are enforced before parsing using the HTTP `Content-Length` header matching `AUDIO_MAX_BYTES`. If exceeded, the server instantly returns a `413 Payload Too Large` status.
- **MIME/Extension Consistency**: Verification ensures the upload file extension and declared MIME type match allowed signatures (MP3, WAV, M4A).

### Rate Limiting Protection
Lightweight in-memory sliding-window limits restrict expensive backend operations:
- **Transcription**: `RATE_LIMIT_TRANSCRIPTION_LIMIT` per window.
- **Analysis**: `RATE_LIMIT_ANALYSIS_LIMIT` per window.
- **Agency crew execution**: `RATE_LIMIT_AGENCY_LIMIT` per window.
- **Workspace Reset**: `RATE_LIMIT_ADMIN_LIMIT` per window.

---

## 🧹 5. Volatile Persistence & Reset Safeguard

### Workspace Administrative Reset (`POST /api/v1/workspace/reset`)
Authorized for `admin` role only. When called, the application identifies all items (meetings, audio assets, transcripts, analysis runs, proposed actions, approvals, audit logs, and agency run traces) corresponding to the caller's specific `tenantId` and `workspaceId` and clears them from in-memory repositories.
- **Isolation Guarantee**: Data belonging to other workspaces or tenants remains untouched.
- **Audit Logging**: The reset event is recorded to the immutable audit log.

---

## 🧪 6. Continuous Security Validation

### Security CI Gate (`.github/workflows/security-ci.yml`)
Runs automatically on push and pull-requests to `main`/`master` and enforces:
1. **Compilation & Type Safety**: Strict TypeScript validations.
2. **Unit & Integration Tests**: Ensures regression specs pass.
3. **E2E Integration Validation**: Confirms role restrictions and tenant boundaries in live router flows.
4. **Secret Scanning**: Executed via GitLeaks.
5. **Dependency Audit**: Scans package dependencies for critical CVEs.
