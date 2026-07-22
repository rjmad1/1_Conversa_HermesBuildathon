# Prioritized Execution Backlog

This document outlines the prioritized backlog of engineering and product initiatives required to execute the Conversa roadmap.

## Prioritization Formula

To ensure transparency, each initiative is evaluated using the following weighted scoring model:

$$\text{Priority Score} = \frac{(\text{User Value} + \text{Business Value} + \text{MVP Necessity} + \text{Risk Reduction}) \times \text{Confidence}}{\text{Implementation Effort} + \text{Operational Burden}}$$

### Evaluation Key
- **Value/Necessity/Risk:** Scale of 1 to 10 (10 = highest value, impact, or contractual lock).
- **Confidence:** Scale of 0.5 to 1.0 (1.0 = high clarity on implementation path).
- **Effort/Burden:** Scale of 1 to 5 (5 = highest complexity, time, or maintenance cost).

---

## Ranked Initiative Matrix

| ID | Initiative | User Value | Business Value | MVP Necessity | Risk Reduction | Confidence | Effort | Burden | Priority Score | Target Horizon |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **BI-001** | Slack Webhook Integration | 8 | 7 | 10 | 4 | 0.95 | 1 | 1 | **13.78** | Horizon 1 |
| **BI-002** | Waitlist Page & Email Capture | 5 | 9 | 10 | 3 | 1.00 | 1 | 1 | **13.50** | Horizon 1 |
| **BI-003** | Daily Sweeps Cron Trigger | 6 | 6 | 10 | 5 | 0.95 | 1 | 1 | **12.83** | Horizon 1 |
| **BI-004** | GitHub Actions CI Eval Gate | 5 | 5 | 6 | 9 | 0.95 | 1 | 1 | **11.88** | Horizon 0 |
| **BI-005** | Convex Persistence Integration | 9 | 9 | 10 | 10 | 0.95 | 2 | 2 | **9.03** | Horizon 1 |
| **BI-006** | Cloudflare Pages/Workers Deploy | 7 | 7 | 10 | 8 | 0.90 | 2 | 2 | **7.20** | Horizon 1 |
| **BI-007** | Linkup Grounding Client | 8 | 8 | 9 | 7 | 0.85 | 2 | 2 | **6.80** | Horizon 1 |
| **BI-008** | Cryptographic Auth (JWT/Clerk) | 9 | 10 | 2 | 10 | 0.90 | 3 | 2 | **5.58** | Horizon 2 |

---

## Backlog Item Scopes & Acceptance Criteria

### BI-001: Slack Webhook Integration
- **User Outcome:** Digest of approved actions lands directly in the team's Slack channel.
- **Problem Solved:** Keeps teams updated without requiring them to check the Conversa UI.
- **Scope:** Hono API adapter dispatching JSON payload to standard incoming webhook URLs.
- **Non-scope:** Full interactive Slack applications or custom block layouts.
- **Dependencies:** None.
- **Acceptance Criteria:**
  - Standard POST payload sent to environment-supplied webhook.
  - Successful dispatch triggers logged audit event.
- **Estimate:** 1 dev day.

### BI-002: Waitlist Page & Email Capture
- **User Outcome:** Interested users can sign up for early access on Cloudflare.
- **Problem Solved:** Captures product signups prior to public release.
- **Scope:** Simple, clean static HTML waitlist page compiled in Vite frontend. Form posts to a waitlist API.
- **Non-scope:** Complex referral mechanisms or authentication checks on waitlist.
- **Dependencies:** None.
- **Acceptance Criteria:**
  - Form validation on client and server.
  - Email successfully saved to local store/database.
- **Estimate:** 1 dev day.

### BI-003: Daily Sweeps Cron Trigger
- **User Outcome:** Meeting analysis is updated automatically every morning.
- **Problem Solved:** Eliminates the need to trigger workspace sweeps manually.
- **Scope:** Hono routing bound to Cloudflare Workers `scheduled` handler.
- **Non-scope:** Scheduling multiple crons per day or dynamic user-defined cron schedules.
- **Dependencies:** BI-005 (Convex).
- **Acceptance Criteria:**
  - Handler fires successfully when mock cron event is triggered.
- **Estimate:** 1 dev day.

### BI-004: GitHub Actions CI Eval Gate
- **User Outcome:** Development pushes that break agency isolation or accuracy are blocked.
- **Problem Solved:** Prevents quality regressions from reaching the main branch.
- **Scope:** Create `.github/workflows/ci.yml` running `npm run eval:agency`.
- **Non-scope:** Complex testing pipelines or multi-architecture builds.
- **Dependencies:** None.
- **Acceptance Criteria:**
  - PR checks fail if eval script returns non-zero.
- **Estimate:** 1 dev day.

### BI-005: Convex Persistence Integration
- **User Outcome:** Run history, decisions, and actions survive application restarts.
- **Problem Solved:** Resolves data volatility of transient in-memory maps.
- **Scope:** Define Convex schemas and write adapter classes for repository ports.
- **Non-scope:** Database migration scripts from in-memory (starts fresh).
- **Dependencies:** None.
- **Acceptance Criteria:**
  - All repository unit and integration tests pass with Convex backend.
- **Estimate:** 3 dev days.

### BI-006: Cloudflare Pages/Workers Deploy
- **User Outcome:** Accessible public URL for product demonstration.
- **Problem Solved:** Makes Conversa shareable and hostable.
- **Scope:** Configure `wrangler.toml` and verify edge runtime.
- **Non-scope:** Multi-region deployment or DNS routing setups.
- **Dependencies:** BI-005.
- **Acceptance Criteria:**
  - Hono endpoints and SPA build bundle successfully on Wrangler local simulation.
- **Estimate:** 2 dev days.

### BI-007: Linkup Grounding Client
- **User Outcome:** Actions and decisions have reference web links confirming facts.
- **Problem Solved:** Prevents AI hallucination and supplies source evidence.
- **Scope:** Linkup REST client querying search endpoints during analysis.
- **Non-scope:** Multi-engine fallback search integrations.
- **Dependencies:** None.
- **Acceptance Criteria:**
  - Specialist steps store an array of reference URLs in findings.
- **Estimate:** 2 dev days.

### BI-008: Cryptographic Auth (JWT/Clerk)
- **User Outcome:** Secure workspace isolation preventing cross-tenant access.
- **Problem Solved:** Replaces spoofable request headers with cryptographically verified JWT checks.
- **Scope:** Hono middleware checking authorization headers and decoding claims.
- **Non-scope:** Building custom signup/login UI pages (use prebuilt Clerk/Auth0 widgets).
- **Dependencies:** None.
- **Acceptance Criteria:**
  - Cross-tenant requests fail with 401 Unauthorized if JWT token is invalid or missing.
- **Estimate:** 4 dev days.
