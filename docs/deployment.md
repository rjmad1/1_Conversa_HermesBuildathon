# Conversa — Deployment (Audio-First) — DECISION RECORD

**Author role:** Platform / DevOps Engineer
**Status:** **RESOLVED — Cloudflare is primary.** (Conflicts with the older Vercel-only MVP plan; this record supersedes it.)

> Note on source: the shared Perplexity link was a private/signed-in session and returned only the login shell — no retrievable content. The decision below is grounded in the architectural constraints in `docs/architecture.md` and `docs/non-functional.md` (60s Vercel cap vs Whisper latency on 10MB audio; need for durable object storage).

## 1. Decision

**Primary deployment target: Cloudflare.**
- **Workers** for API/runtime (longer CPU limits than Vercel's 60s function cap).
- **R2** for audio object storage (opaque, tenant/workspace-scoped references).
- **Pages** for the UI (or Worker-served static).
- **KV / D1 / Convex** for metadata + `TranscriptionJob` state (pick one; see §5).
- **Partner alignment:** Cloudflare is already the hosting/edge/security partner in `TechnicalNeeds.md`.

Vercel is **not** used in this release. If a future phase needs Vercel, the runtime boundary (Workers-compatible, no Node-only FS reliance) must be preserved.

## 2. Why Cloudflare (brutal)

| Risk | Vercel | Cloudflare |
| --- | --- | --- |
| 10MB MP3 → Whisper latency | 60s hard cap → silent 408/timeouts | Higher CPU limit → survives |
| Durable audio storage | None (ephemeral FS) → needs R2/S3 anyway | Native R2 |
| Partner consistency | No | Yes (hosting partner) |

## 3. Storage Layout

```text
R2 bucket: conversa-media
  tenants/{tenantId}/workspaces/{workspaceId}/media/{assetId}
```
- `assetId` opaque (UUID). Signed URL / controlled access for retrieval.
- Relational/doc record stores metadata + `storageReference` only — **never raw audio bytes**.
- **No raw audio in logs** (only `assetId` + `status`).

## 4. Env / Config (`.env.example`)
- `AUDIO_MAX_BYTES=10485760`, `AUDIO_MAX_SECONDS=7200`
- `AUDIO_ALLOWED_MIME_TYPES=audio/mpeg,audio/wav,audio/mp4`
- `MEDIA_VIDEO_ENABLED=false`
- `TRANSCRIPTION_PROVIDER=openai`
- `AUDIO_STORAGE_PREFIX=media`, `AUDIO_RETENTION_DAYS=90`
- `CLOUDFLARE_R2_BUCKET`, `CLOUDFLARE_ACCOUNT_ID` (secrets via Cloudflare env, not committed)

## 5. Open Deployment Decisions (still open — resolve in build)

1. **Metadata store:** D1 (SQLite) vs KV vs Convex. For MVP speed + relational shape (`AudioAsset` fields), **D1** is the pragmatic pick; Convex if realtime is desired later. Pick one.
2. **Tenant resolution:** Fixed demo tenant (`demo`/`demo`) per `docs/architecture.md` §6; header-based extension (`X-Tenant-Id`/`X-Workspace-Id`) documented, inactive until auth.
3. **TranscriptionJob state:** store status in the same metadata store; poll or webhook from Worker.
4. **Sample asset:** `public/sample-meeting.mp3` must exist (repo currently has none). Source a licensed short clip; add `video/sample-rejected.mp4` for the 415 test only.

## 6. CI/CD
- GitHub Actions: lint → type-check → test → build (wrangler) → deploy.
- Rollback: `wrangler rollback` / Cloudflare previous deployment.

## 7. Constraints (hard)
- Audio ≤ limits; MP3/WAV/M4A only.
- No video, no camera.
- Raw audio never in logs; opaque storage references.
