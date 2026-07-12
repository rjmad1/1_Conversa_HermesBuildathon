# Final Acceptance Artifact 01: Build Metadata Verification

This document verifies the injection of dynamic build metadata (commit SHA and application version) into both the user interface and health observability endpoints.

## Build Metadata Configuration
The build process in [vite.config.ts](file:///c:/Users/rajaj/Projects/1_Conversa/vite.config.ts) was updated to extract the current git commit SHA:
```typescript
let commitSha = process.env.VERCEL_GIT_COMMIT_SHA || "";
if (!commitSha) {
  try {
    commitSha = execSync("git rev-parse --short HEAD").toString().trim();
  } catch (e) {
    commitSha = "dev";
  }
} else {
  commitSha = commitSha.substring(0, 7);
}
```

## Observability Endpoint Verification
A GET request to `https://1-conversa-hermes-buildathon.vercel.app/api/health/live` returns a valid JSON response:
```json
{
  "live": true,
  "version": "0.3.0",
  "commit": "d3706af"
}
```
This matches the latest deployed commit SHA `d3706af`, confirming traceability of the live deployment.

## User Interface Verification
The UI startup script [ui.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/ui/ui.ts) dynamically updates the footer layout:
```typescript
const commitEl = document.querySelector(".commit-sha");
if (commitEl) {
  commitEl.textContent = import.meta.env.VITE_GIT_COMMIT_SHA || "dev";
}
```
This replaces static placeholder hashes on initialization with the active build SHA.
