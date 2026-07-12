# Audio Asset Storage & Security

> Companion to `docs/adr/0002-audio-first-media-scope.md`.

## 1. Storage Rules

- **Opaque identifiers.** `storageReference` is a generated, non-guessable key (e.g.
  `sha256-ish` UUID or object-store key). Never derive from user input or filename.
- **Tenant and workspace scoped.** Object-store prefix: `tenants/{tenantId}/workspaces/{workspaceId}/media/{assetId}`.
- **No public access by default.** Buckets/containers are private; retrieval uses
  **signed URLs** or controlled service-to-service access, short-lived.
- **Configurable retention.** `retentionDays` per tenant; a retention job deletes assets
  and their `storageReference` after expiry.
- **Excluded from application logs.** Raw audio bytes, signed URLs (after issue), and
  local paths are never logged. Logs reference only `assetId` and `status`.
- **Never expose local paths.** APIs return `storageReference` only; absolute/local
  filesystem paths are never serialized.
- **No raw audio in relational/doc record.** The media record stores metadata +
  `storageReference`, not the audio payload (object storage or existing file-storage
  abstraction holds the bytes).
- **Deletable via retention workflows.** Hard-delete asset + object by retention or
  user/tenant deletion, with audit event emitted.

## 2. Security Controls

- Encryption at rest (KMS-managed) and in transit (TLS 1.3).
- Least-privilege IAM for the storage principal.
- Tenant isolation enforced at the storage prefix and at the API authorization layer.
- Audit event for every create/read/delete of an asset (no raw bytes in the event).
- Checksum verified on read-back where feasible.

## 3. Future Video (not implemented)

When `VIDEO` is added, it reuses this exact storage/security model under a parallel
`media/` prefix; no new storage paradigm is introduced.
