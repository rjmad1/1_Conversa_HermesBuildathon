# Final Acceptance Artifact 00: Starting State

This document captures the baseline configuration of the Conversa repository prior to the Fifteenth Gate verification and regression closure run.

## Baseline Metadata
- **Initial Commit SHA:** `3717d357383417544fc04aa707f73a526aef9567`
- **Active Git Branch:** `main`
- **Initial Vercel Status:** HTTP 404 (Domain not linked) / HTTP 500 (Node.js ESM imports crash)
- **Pre-existing Local Tests:** 17 unit tests, 29 integration tests, 10 E2E tests (56 total)
- **Initial Baseline Score:** 10.0 / 10.0

## Verified Deficiencies & Risks
1. **Build Traceability Gap:** The built frontend displayed a stale, hardcoded commit SHA (`a0bde80`) instead of pulling it dynamically from the Git repository.
2. **ESM Directory Imports Crash:** Under Vercel's Serverless environment, relative imports without file extensions (e.g. `import { getConfig } from "../shared/config"`) resulted in `ERR_UNSUPPORTED_DIR_IMPORT` or `ERR_MODULE_NOT_FOUND` runtime crashes.
3. **Prototype Authentication Boot Guard:** The `DevIdentityAdapter` was configured to fail closed under any environment where `process.env.NODE_ENV === "production"`, causing immediate application boot failures on Vercel.
4. **Missing Coverage:** No unit or E2E tests were present to cover validation guards for malformed transcript submissions.
