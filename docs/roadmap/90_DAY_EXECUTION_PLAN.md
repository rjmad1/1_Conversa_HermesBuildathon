# 90-Day Execution Plan

This document establishes the tactical 90-day timeline to execute the rebased roadmap, organized into four key execution windows.

---

## Days 0–14: Baseline Stabilization & Quality Gates

### Objectives
Freeze the verified in-memory baseline, configure automated continuous integration, and scaffold Cloudflare deployment configurations.

### Deliverables
- **Automated CI Gate:** GitHub Actions workflow (`.github/workflows/ci.yml`) running lint, typecheck, tests, and agency evaluation.
- **Wrangler Scaffolding:** `wrangler.toml` file mapping environment variables and Cloudflare Worker routing.
- **Waitlist Page:** Vite static waitlist route (`/waitlist`) capturing email signups.

### Dependencies
- None.

### Acceptance Gates
- Pull request evaluation suite executes successfully and blocks merges on quality regression.
- Vite project compiles waitlist static files with zero warnings.

### Metrics
- CI execution time < 5 minutes.
- Build success rate = 100%.

### Risks
- Local Hono packages might require polyfills when migrating to the Cloudflare Workers edge environment.

### Decision Points
- Select email capture storage (e.g. SQLite D1 table vs temporary external endpoint).

---

## Days 15–30: Persistence & Core Integrations (MVP Slice)

### Objectives
Eradicate data volatility, connect Slack collaboration channels, and launch the public MVP demonstration.

### Deliverables
- **Convex Persistence:** Convex schemas and repository adapters for meetings, transcripts, and runs.
- **Slack Webhook Client:** Notification adapter posting approved meeting digests and action items.
- **Linkup Client:** Context retrieval service embedding external source links into findings.
- **Public Deploy:** Live production deployment of client and server on Cloudflare.

### Dependencies
- Days 0-14 CI gates.
- Convex account configuration and API bindings.

### Acceptance Gates
- Automated integration tests successfully read and write to the Convex database.
- Approving a meeting run via the UI dispatches a validated action summary to the configured Slack channel.

### Metrics
- Convex read/write latency < 25ms.
- Slack webhook delivery success rate = 100%.

### Risks
- Network timeouts when calling live OpenAI and Linkup APIs simultaneously.

### Decision Points
- Establish policy for default specialist agent timeouts (e.g., limit execution to 15 seconds).

---

## Days 31–60: Pilot Usability, Auth & Observability

### Objectives
Secure the platform for real design partners, implement real authentication, and audit operational telemetry.

### Deliverables
- **Clerk/JWT Auth Integration:** Middleware replacing header-based developer identities with validated JWT claims.
- **Live LLM Telemetry:** Real OpenAI client verification in production, tracking actual latencies and token counts.
- **User Settings & Controls:** Pilot admin panel allowing users to configure custom meeting policies and thresholds.

### Dependencies
- Days 15-30 Convex database persistence.

### Acceptance Gates
- Requests without a valid JWT token are rejected with 401 Unauthorized.
- Trace UI accurately reports token counts and USD costs from live model completions.

### Metrics
- Active pilot users = 3–5 design partners.
- Unauthorized request leakage = 0.

### Risks
- Client-side token leakage or credential sharing among pilot users.

### Decision Points
- Decide on role-based workspace scopes (e.g., owner vs contributor access limits).

---

## Days 61–90: Enterprise Foundations & Uptime SLA

### Objectives
Prepare the application for broader enterprise adoption by hardening security and establishing performance SLOs.

### Deliverables
- **Security Shields:** Prompt-injection filters and input validation guards.
- **Tamper-Evident Audit:** Move append-only audit events to immutable storage or locked logging instances.
- **Degraded-Mode Operation:** Model fallback routing (e.g. failover to Anthropic if OpenAI is down).

### Dependencies
- Days 31-60 Clerk Auth.

### Acceptance Gates
- Security penetration scans yield zero high-severity findings.
- Failed LLM calls successfully fall back to secondary models without breaking execution runs.

### Metrics
- Uptime SLA > 99.9%.
- Average run cost bounded to < $0.05 USD.

### Risks
- Rapid cost escalation if revision retries loop uncontrollably under edge network delays.

### Decision Points
- Draft commercial tier packages (e.g., free tier vs team budgets and usage quotas).
