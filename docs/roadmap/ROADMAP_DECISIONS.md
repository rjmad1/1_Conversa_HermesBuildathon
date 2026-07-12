# Roadmap Decisions

This document details the architectural and product decisions (ADRs) governing the Conversa roadmap, providing context, decisions, rationales, alternatives considered, and consequences.

---

## ADR 0001: Canonical Hosting Target and API Framework

### Status
Approved

### Context
Conversa must be deployed to a public URL for the Buildathon demonstration. The initial codebase shift transitioned from Next.js serverless functions to Hono + Vite SPA. We must choose a canonical hosting target between Vercel and Cloudflare Pages/Workers.

### Decision
Deploy the Hono API backend on **Cloudflare Workers** and host the compiled Vite SPA static frontend on **Cloudflare Pages**. 

### Rationale
- Cloudflare Workers provide sub-millisecond cold starts and edge-native performance, matching our audio-first real-time streaming vision.
- Aligns directly with the Buildathon requirement of being hosted on Cloudflare Pages.

### Alternatives
- **Vercel Serverless Functions:** Easier setup out-of-the-box with Hono, but incurs higher cold start latency.

### Consequences
- Requires migrating from Node-specific APIs to Cloudflare Workers runtime compatibility.
- Needs a wrangler configuration (`wrangler.toml`) and environment variable bindings.

---

## ADR 0002: Canonical Persistence and Database Layer

### Status
Approved

### Context
The current application state is fully transient, stored in memory maps that reset on server recycled instances. We need a persistent database for run histories, snapshots, and meeting metadata.

### Decision
Adopt **Convex** as the primary persistence layer for structured meeting analysis, agency run logs, and workspace state.

### Rationale
- Convex offers fully reactive, real-time database queries, making the Trace UI instantly update as specialist agents execute steps.
- Schema definition and migrations are managed in-code with TypeScript.

### Alternatives
- **Cloudflare D1 (SQLite):** Good edge database, but lacks the native reactivity and real-time subscription models of Convex.

### Consequences
- Requires introducing the Convex client library and implementing Convex-backed adapters for our repositories.

---

## ADR 0003: Primary Workflow and External Integration Focus

### Status
Approved

### Context
We must prioritize downstream integrations to prevent scope creep. We need to decide which integration to build first.

### Decision
Select **Slack Webhooks/APIs** as the primary external write target for meeting action digests.

### Rationale
- Slack is the most common collaboration surface for design partners.
- Simpler to implement than full OAuth-backed CRM tools like Salesforce or Jira, reducing implementation risk.

### Alternatives
- **Jira Cloud:** Deferred to Horizon 2 to prevent excessive integration setup during the core slice build.

### Consequences
- A Slack incoming webhook url will be required in the environment variables.

---

## ADR 0004: Authentication Timing and Strategy

### Status
Approved

### Context
The application uses caller-supplied headers in dev mode. We need to plan when to enforce cryptographic authorization.

### Decision
Defer cryptographic authentication (JWT verification via Clerk/Auth0) to **Horizon 2 (Pilot Readiness)**. Keep Horizon 1 (Buildathon) restricted to Developer Scoped headers.

### Rationale
- Focuses Horizon 1 purely on the functional vertical slice (the audio-to-action pipeline).
- Prevents authentication setup from blocking the core demonstration.

### Alternatives
- **Build Auth in Horizon 1:** High risk of configuration overhead stalling the Buildathon delivery.

### Consequences
- The Buildathon public deployment will require clear disclaimer notices stating that isolation is currently header-driven and not cryptographically locked.

---

## ADR 0005: External-Source Grounding Policy

### Status
Approved

### Context
Specialist agents might extract action items or claims that are ambiguous or require external verification.

### Decision
Use **Linkup Search API** as the canonical grounding client to query external web data and link sources to findings.

### Rationale
- Satisfies the Buildathon expectation for researcher source links.
- Ensures generated outputs are verifiable and prevents LLM hallucination.

### Alternatives
- **Direct Web Scraping:** High complexity and fragile selector maintenance.

### Consequences
- Requires setting up a Linkup developer key and API client.

---

## ADR 0006: Human-in-the-Loop Approval Policy

### Status
Approved

### Context
AI agents should not trigger external side effects (e.g. posting to Slack) without human review.

### Decision
Enforce a **PAUSED** status gate on all agency runs by default. No external writes or notifications are triggered until an administrator approves the run outputs.

### Rationale
- Prevents low-confidence or hallucinated actions from polluting external workflows.
- Matches the verified state transition machine.

### Alternatives
- **Fully Automated Dispatch:** High risk of incorrect Slack notifications.

### Consequences
- Requires adding an "Approve" button to the Trace UI, triggering the `/api/v1/agency/runs/:runId/approve` endpoint.

---

## ADR 0007: Cron Scheduling and Timezone Configuration

### Status
Approved

### Context
Daily digests and workspace updates must fire automatically.

### Decision
Utilize **Cloudflare Cron Triggers** running at **8:00 AM local time** (tenant-configured timezone) to execute sweeps and dispatch digests.

### Rationale
- Integrates natively with Cloudflare Workers.
- Simulates a real-world routine workspace sweep.

### Consequences
- Cron routing must be added to `wrangler.toml` and bound to Hono controllers.

---

## ADR 0008: Demo Fallback and Synthetic Fixtures Policy

### Status
Approved

### Context
Live demos can fail due to external API timeouts or model rate limits. We need a reliable fallback.

### Decision
Maintain a **Fake/Mock provider mode** toggleable via environment variables (`ANALYSIS_PROVIDER=fake`). 

### Rationale
- Guarantees that the demo can run in under 30 seconds with 100% reliability, without relying on active OpenAI API keys or network availability during presentations.

### Consequences
- The test suite must cover both fake provider assertions and live OpenAI validation structures.
