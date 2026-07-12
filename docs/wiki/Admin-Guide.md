# Admin Guide

> **Current-state notice:** Conversa is an active Buildathon prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

Guidance for administrators managing the Conversa snapshot.

## Runtime
* Backend runs on Hono (Node.js).
* Frontend is a Vite Single Page Application.

## Environment Variables
* `PORT`: Server port (default `5173`).
* `AUDIO_MAX_BYTES`: Max audio upload size (default `10485760` / 10MB).
* `AUDIO_ALLOWED_MIME_TYPES`: Allowed audio formats (default `audio/mpeg,audio/wav,audio/mp4`).

## Authentication & Identity
> [!WARNING]
> **Scoping Warning**: Caller-supplied development tenant and workspace headers (`x-tenant-id`, `x-workspace-id`) are not production credentials. They are spoofable and are meant only for development isolation validation.

## In-Memory Database behavior
The backend maintains data in volatile memory Maps. Any service recycle or cold start will purge all meeting logs, audits, and action statuses.

## Logging and Redaction
Logs undergo recursive key scrubbing. All keys matching `key`, `token`, `secret`, or `audio` are redacted up to 10 nested levels deep.
