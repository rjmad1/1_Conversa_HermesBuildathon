# Audio Ingestion Validation

> Companion to `docs/adr/0002-audio-first-media-scope.md` and `docs/media-domain-model.md`.

## 1. Rules (enforced at ingestion boundary)

1. **Audio MIME-type allowlist.** Accept only:
   - `audio/mpeg` (MP3)
   - `audio/wav` (WAV)
   - `audio/mp4` (M4A)
2. **Configurable file-size limit.** Reject above `MAX_AUDIO_BYTES` (default 10 MB; configurable per tenant).
3. **Configurable duration limit.** Reject above `MAX_AUDIO_SECONDS` (configurable per tenant).
4. **Empty-file rejection.** `sizeBytes === 0` → reject.
5. **Extension / MIME consistency.** File extension must correspond to the declared MIME
   (`.mp3`↔`audio/mpeg`, `.wav`↔`audio/wav`, `.m4a`↔`audio/mp4`). Mismatch → reject.
6. **Malformed audio rejection (where feasible).** Probe container/codec; reject files that
   fail a lightweight decode/parse check. Best-effort; never block on unavailable probes.
7. **Sanitized filenames.** Strip path components, control chars, and null bytes. Store only
   a sanitized base name; never store or log a local/absolute path.
8. **Checksum generation.** Compute `checksum` (SHA-256) on ingest for integrity.
9. **Tenant-scoped storage references.** `storageReference` is opaque and prefixed by
   `tenantId`/`workspaceId`; never user-controllable paths.
10. **No video.** Any `video/*` MIME, or a file whose probe reveals a video container, is
    rejected with `UNSUPPORTED_MEDIA_TYPE`.

## 2. Error Contract

### `UNSUPPORTED_MEDIA_TYPE`

- **HTTP status:** `415`
- **Stable error code:** `UNSUPPORTED_MEDIA_TYPE`
- **Message (user-facing):** "Only audio files are currently supported (MP3, WAV, M4A).
  Video and other media types are not accepted in this release."
- **Details:** `{ receivedMimeType, allowedMimeTypes: [...] }`

Other validation failures use distinct codes (e.g. `FILE_TOO_LARGE`, `DURATION_EXCEEDED`,
`EMPTY_FILE`, `MIME_EXTENSION_MISMATCH`, `MALFORMED_AUDIO`, `BAD_REQUEST`) so callers can
distinguish them from the video rejection.

## 3. Configuration (example, see `.env.example`)

```text
AUDIO_MAX_BYTES=10485760
AUDIO_MAX_SECONDS=7200
AUDIO_ALLOWED_MIME_TYPES=audio/mpeg,audio/wav,audio/mp4
```

## 4. Security Notes

- Raw audio bytes are **never** written to application logs.
- Storage references are opaque; local filesystem paths are never exposed via API.
- Validation runs before persistence; rejected files are not stored.
