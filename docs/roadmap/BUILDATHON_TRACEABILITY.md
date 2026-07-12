# Buildathon Traceability Matrix

This document maps the official Buildathon expectations to Conversa's product-aligned equivalents, detailing implementation status, required work, and demonstration steps.

## Requirements to Product Traceability

### 1. Announcement Post
- **Buildathon Expectation:** Post that you are building this right now (first impressions & signups).
- **Product-Aligned Interpretation:** Public launch announcement detailing Conversa's audio-to-governed-action value proposition.
- **Current Status:** `MISSING`
- **Required Work:** Draft marketing copy and social media launch post.
- **Repository Evidence:** None.
- **Demo Step:** N/A (Pre-event engagement).
- **Completion Status:** `NOT STARTED`

### 2. Live Waitlist Page
- **Buildathon Expectation:** Waitlist page live before building anything (one headline, one email field, hosted on Cloudflare Pages).
- **Product-Aligned Interpretation:** Static signup landing page for Conversa waitlist.
- **Current Status:** `MISSING`
- **Required Work:** Create static `waitlist.html` and compile it via Vite, deploy to Cloudflare.
- **Repository Evidence:** None.
- **Demo Step:** Open public Cloudflare Pages URL showing the live waitlist form.
- **Completion Status:** `NOT STARTED`

### 3. Agent Crew Skeleton
- **Buildathon Expectation:** Intel chief agent managing per-competitor researchers plus analyst and QA, on one competitor first.
- **Product-Aligned Interpretation:** Conversa Meeting Manager (Chief) planning and dynamically dispatching meeting analysis tasks to specialist agents (Decisions, Action Items, Risks) and executing QA Reviewer policy checks.
- **Current Status:** `VERIFIED_WORKING`
- **Required Work:** Core logic is fully written and tested using mock/fake models. Real OpenAI validation is implemented but unverified in test suite.
- **Repository Evidence:** [run-meeting-agency.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/modules/agency/application/run-meeting-agency.ts)
- **Demo Step:** Narrate the manager planning stage, show skipped/executed specialist steps based on meeting topic keyword heuristics.
- **Completion Status:** `COMPLETE (IN-MEMORY)`

### 4. Downstream Integrations (Surfaces)
- **Buildathon Expectation:** Battlecard dashboard on Cloudflare Pages and daily digest wired into a real Slack channel.
- **Product-Aligned Interpretation:** Compiled Vite SPA trace UI dashboard hosted on Cloudflare Pages; meeting decisions and actions digest delivered to a live Slack channel via incoming webhooks.
- **Current Status:** `PARTIALLY_IMPLEMENTED`
- **Required Work:** Write the live Slack API webhook integration client; compile and deploy Vite SPA to Cloudflare Pages.
- **Repository Evidence:** [ui.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/ui/ui.ts) (Frontend client dashboard layout exists)
- **Demo Step:** Open the dashboard, review meeting results, and verify the final digest post in a real Slack channel.
- **Completion Status:** `IN PROGRESS`

### 5. Inspectable Run Log
- **Buildathon Expectation:** Run log showing researcher findings, Linkup source links, analyst's diff, and QA source check.
- **Product-Aligned Interpretation:** Trace UI run history showing step-by-step agent inputs, outputs, grounding sources, revision cycles, and QA approval/escalation reasons.
- **Current Status:** `VERIFIED_WORKING`
- **Required Work:** Integrate Linkup search API client and persist run trace schemas in Convex database.
- **Repository Evidence:** [ui.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/ui/ui.ts) (Details pane and history compare views are implemented)
- **Demo Step:** Click an active/historical run on the UI, expand its steps, and highlight a QA revision loop or escalation event.
- **Completion Status:** `PARTIALLY COMPLETE`

### 6. Workspace Baseline Snapshot
- **Buildathon Expectation:** Day-one snapshot of competitor pricing, changelogs, and news into Convex memory for delta diffing.
- **Product-Aligned Interpretation:** Workspace baseline snapshot (capturing previous meeting outcomes and action item statuses) saved into Convex memory.
- **Current Status:** `MISSING`
- **Required Work:** Implement Convex schemas and a snapshot baseline utility to diff current findings against prior states.
- **Repository Evidence:** None.
- **Demo Step:** Show the "yesterday's snapshot" state prior to running the sweep.
- **Completion Status:** `NOT STARTED`

### 7. End-to-End Sweep execution
- **Buildathon Expectation:** E2E sweep: researchers fan out, analyst diffs, QA checks sources, digest lands in Slack.
- **Product-Aligned Interpretation:** Core user workflow: Submit a transcript, trigger agency crew planning, run specialists, QA verifies or retries, write finalized outcomes, and push notification digest to Slack.
- **Current Status:** `VERIFIED_WORKING`
- **Required Work:** Wire the core in-memory logic to Convex database persistence and Slack API endpoints.
- **Repository Evidence:** `tests/integration/agency/agency.spec.ts` ("executes the full crew sequence")
- **Demo Step:** Click "Run Agency" in the UI, watch the log fill in real time, and show the digest appearing in Slack.
- **Completion Status:** `PARTIALLY COMPLETE`

### 8. Repeatable Scheduled Execution (Cron)
- **Buildathon Expectation:** 8:00 AM cron firing for real across event days for genuine history.
- **Product-Aligned Interpretation:** Cloudflare Workers cron task running daily at 8:00 AM to perform workspace analysis sweeps and send updates.
- **Current Status:** `MISSING`
- **Required Work:** Configure Cloudflare wrangler cron trigger routing to a dedicated controller in the Hono app.
- **Repository Evidence:** None.
- **Demo Step:** Trigger cron manually or demonstrate historical runs generated on previous days.
- **Completion Status:** `NOT STARTED`

### 9. Demo Rehearsal
- **Buildathon Expectation:** Walkthrough showing snapshot, live sweep trigger, log narration, and Slack landing.
- **Product-Aligned Interpretation:** Detailed presenter demo script with step-by-step timing and fallback plans.
- **Current Status:** `PARTIALLY_IMPLEMENTED`
- **Required Work:** Practice timing, refine narration, ensure mock fallback mode works seamlessly.
- **Repository Evidence:** [DEMO_SCRIPT.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/DEMO_SCRIPT.md)
- **Demo Step:** Live presentation to mentors and judges.
- **Completion Status:** `IN PROGRESS`
