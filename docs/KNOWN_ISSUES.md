# Conversa — Known Issues & System Limitations

---
### 📋 Document Metadata
- **Purpose**: Catalogs existing software defects, architectural limitations, temporary workarounds, and planned fixes.
- **Audience**: Developers, SREs, QA engineers, and system support.
- **Last Generated**: 2026-07-13T05:20:47+05:30
- **Confidence Level**: High (Directly verified by repository audits and test configurations).
- **Evidence Used**: Core database structures, identity adapter code, and Vitest test scenarios.
- **Cross References**: See [CURRENT_STATE.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/CURRENT_STATE.md), [TROUBLESHOOTING.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/TROUBLESHOOTING.md).
- **Open Questions**: Rotation guidelines for static tokens in production.
- **Known Limitations**: ephemerality of in-memory data.
- **Recommended Next Actions**: Transition static memory repositories to Convex schema definitions.
---

## 1. Active Issues Catalog

### 1.1 In-Memory Persistence (Data Ephemerality)
* **Description**: Restarting the Node server clears all meetings, audio assets, transcripts, and audit logs.
* **Root Cause**: The repositories (`InMemoryMeetingRepo`, etc.) store data structures in volatile Map arrays.
* **Workaround**: Avoid rebooting server instances during tests; use the workspace reset endpoint (`POST /api/v1/workspace/reset`) to manually clean scopes between test runs.
* **Permanent Fix**: Implement persistent database adapters (Cloudflare D1 or Convex) as outlined in Horizon 1.
* **Priority**: High

### 1.2 Static Production Token Mapping
* **Description**: In production, the `ProdIdentityAdapter` verifies Bearer tokens from a static environment-variable mapping list, lacking dynamic user login.
* **Root Cause**: Simplification of auth requirements for the MVP prototype release.
* **Workaround**: Securely configure and rotate tokens using secrets management.
* **Permanent Fix**: Integrate external identity providers (Clerk or Auth0) and verify signatures in Hono middleware.
* **Priority**: Medium

### 1.3 Request Timeout limits during Audio Processing
* **Description**: Large audio file uploads (up to 10MB) can take over 60 seconds to process through external Whisper API endpoints, causing HTTP timeouts on serverless runtimes.
* **Root Cause**: Synchronous execution of transcription within the REST request-response loop.
* **Workaround**: Restrict uploads to short audio clips in the demo, or utilize pasted transcripts.
* **Permanent Fix**: Move transcription to an asynchronous background worker queue and implement webhook notifications.
* **Priority**: High

### 1.4 QA Reviewer Loop Lock Vulnerability
* **Description**: If specialist output consistently violates validation policies, the coordinator could enter an infinite revision loop, consuming massive token credits.
* **Root Cause**: Sequential coordination loops.
* **Workaround**: Hard-coded revision limit (`revisionCount <= 1`) exits the loop and escalates the step.
* **Permanent Fix**: Improve specialist prompts with strict format grounding rules.
* **Priority**: Low
