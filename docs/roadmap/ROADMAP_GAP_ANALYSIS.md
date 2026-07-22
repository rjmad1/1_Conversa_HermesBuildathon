# Roadmap Gap Analysis

This document identifies contradictions between documentation claims (e.g. Wiki Roadmap, MVP submissions) and the actual state of the Conversa repository. It provides remediation recommendations and priorities.

## Identified Gaps & Deficiencies

### 1. Cryptographic Tenant Isolation vs. Unsigned Dev Headers
- **Roadmap Claim:** The system provides secure multi-tenant boundaries.
- **Repository Reality:** Tenant and workspace scopes are resolved strictly via request headers (`x-tenant-id`, `x-workspace-id`) in [identity.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/shared/security/identity.ts) using a development identity adapter. No JWT signature verification or token verification is present.
- **Consequence:** Vulnerable to BOLA and identity spoofing; any caller can access foreign tenant data by simply rewriting headers.
- **Recommended Correction:** Replace `DevIdentityAdapter` with a middleware JWT decoder (e.g., Clerk or Auth0 integration) that cryptographically verifies the caller identity and claims.
- **Evidence Path:** `src/shared/security/identity.ts`
- **Priority:** High
- **Roadmap Horizon:** Horizon 2

### 2. Persistent Storage (Convex/D1) vs. Volatile In-Memory Maps
- **Roadmap Claim:** Run history, snapshots, and meeting analysis are persisted.
- **Repository Reality:** All repositories (meetings, transcripts, agency runs, audit events) inherit from in-memory maps in [in-memory.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/repositories/in-memory.ts).
- **Consequence:** High volatility. Recycling the Vercel serverless function or restarting the server immediately erases all data, making history comparisons and long-term memory impossible.
- **Recommended Correction:** Implement the Convex persistence client adapters and define schemas for meeting runs, actions, decisions, and audit events.
- **Evidence Path:** `src/infrastructure/repositories/in-memory.ts`
- **Priority:** High
- **Roadmap Horizon:** Horizon 1

### 3. Integrated Delivery (Slack/Jira) vs. Non-existent Webhooks
- **Roadmap Claim:** Actions are synced to Jira and daily digests are delivered to Slack.
- **Repository Reality:** No code exists for Slack webhooks or Jira connectors; they are entirely mocked or planned only in documentation.
- **Consequence:** The final step of the "audio-to-action" flow is a dead end unless viewed in the local UI. No external work surfaces are notified.
- **Recommended Correction:** Write a dedicated integration adapter for Slack Incoming Webhooks to deliver daily execution digests and action lists.
- **Evidence Path:** `src/app/index.ts` (lacks integration routing/controllers)
- **Priority:** Medium
- **Roadmap Horizon:** Horizon 1 (Slack), Horizon 2 (Jira)

### 4. Linkup-backed Source Grounding vs. Hardcoded Mock Reviewer
- **Roadmap Claim:** Action items are grounded in external sources retrieved via Linkup.
- **Repository Reality:** Grounding checks in [qa-reviewer.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/modules/agency/infrastructure/qa-reviewer.ts) use static, hardcoded heuristics matching mock inputs. No Linkup API client exists.
- **Consequence:** The agent cannot dynamically lookup or verify external evidence; it relies entirely on the local transcript's ambient claims.
- **Recommended Correction:** Implement a Linkup API client and incorporate external web/document searches into the specialist planning stage.
- **Evidence Path:** `src/modules/agency/infrastructure/qa-reviewer.ts`
- **Priority:** Medium
- **Roadmap Horizon:** Horizon 1

### 5. Automated CI Gates vs. Local-only Eval Commands
- **Roadmap Claim:** Continuous evaluation gates block regressions in build releases.
- **Repository Reality:** `run-eval.ts` exists and enforces quality thresholds, but there is no CI workflow (e.g. GitHub Actions) or Git hooks configured to block merges on regression.
- **Consequence:** Developers can merge code changes that degrade extraction accuracy or break isolation rules without CI notifying them.
- **Recommended Correction:** Create a GitHub Actions workflow in `.github/workflows/ci.yml` that runs `npm run eval:agency` on every push/PR.
- **Evidence Path:** Root directory (no `.github/` folder exists)
- **Priority:** High
- **Roadmap Horizon:** Horizon 0 (Documentation Baseline Lock)

### 6. Cloudflare Pages/Workers target vs. Local-only Node/Vercel
- **Roadmap Claim:** Platform is hosted on Cloudflare.
- **Repository Reality:** The project builds using Vite and Hono, and is configured for Vercel Serverless deploy. While `worker.ts` exists, there is no Wrangler configurations, D1 schemas, or R2 bucket bindings.
- **Consequence:** Deploying to Cloudflare requires significant reconfiguration and is unverified.
- **Recommended Correction:** Add `wrangler.toml`, migrate repositories to D1 SQLite database adapters, and verify Hono routing inside the Cloudflare Workers runtime.
- **Evidence Path:** `vercel.json` (exists), `wrangler.toml` (missing)
- **Priority:** High
- **Roadmap Horizon:** Horizon 1
