# 06 — Ecosystem Inventory

- **Platform Name**: Conversa Platform
- **Repository Root**: `c:\Users\rajaj\Projects\1_Conversa`
- **Last Synchronized**: 2026-07-23T05:10:00+05:30

---

## 🗂️ Complete Directory & Module Inventory

### 📁 Root Directory Layout
* `app/`: Next.js 16 App Router UI shell, pages, layouts, and components.
* `src/`: Core domain modules, platform contracts, shared libraries, security, and infrastructure.
* `convex/`: Convex serverless backend schemas (`schema.ts`), reactive queries, and mutations.
* `api/`: Hono Node.js REST API server entrypoint (`server.ts`, `index.js`).
* `docs/`: Comprehensive project documentation suite and digital twin knowledge base.
* `evaluation/`: Agency and intelligence evaluation harnesses (`run-eval.ts`, `run-intel-eval.ts`).
* `infrastructure/`: Deployment scripts, Docker setup, and environment configurations.
* `tests/`: 49 Vitest unit, integration, and E2E test suites (229 passed tests).

---

## 📦 Core Domain Modules (`src/modules/*`)

1. **`agency`**: Managed agency crew, agent runner, and A2A negotiator protocol.
2. **`analysis`**: Capability router, LLM failover router, meeting pipeline runner.
3. **`approvals`**: Human-in-the-loop approval workflow manager.
4. **`audit`**: Cryptographic audit logger and tamper-evident event log.
5. **`cache`**: Memory and redis caching abstraction layer.
6. **`cognitive-collaboration`**: Evidence blackboard, debate coordinator, and consensus generator.
7. **`competitive-intelligence`**: Feature matrix analysis and competitor parity engine.
8. **`context`**: Context window optimizer and token management.
9. **`graph`**: Living Knowledge Graph engine, node/edge models, cycle detector.
10. **`integrations`**: Native hand-off connectors for Jira, Linear, GitHub, Azure DevOps, and Slack.
11. **`interaction-intelligence`**: AegisOS Kernel adapter, explainability traces, cognitive metrics.
12. **`knowledge`**: Knowledge artifact repository and domain entities.
13. **`knowledge-publishing`**: Audience publishers, multi-format serializers, 3-hash lineage verification.
14. **`living-workspace`**: Living workspace facade, timeline engine, evolution engine.
15. **`media`**: Audio chunk processor, media formats, zero-touch ambient join bot.
16. **`meeting-intelligence`**: High-level meeting analysis orchestrator.
17. **`meetings`**: Meeting entity model, lifecycle states, storage adapters.
18. **`metadata`**: Extensible key-value metadata store and schema validation.
19. **`query`**: Natural language workspace query processor.
20. **`retrieval`**: Vector RAG similarity engine and context retrieval.
21. **`saved-searches`**: Saved query filters and subscription triggers.
22. **`search`**: Full-text and semantic search engine.
23. **`transcription`**: Whisper/Deepgram audio transcription adapter.
24. **`views`**: Dynamic workspace view projection engine.
25. **`workspace`**: Workspace domain boundary, isolation manager, membership controls.

---

## 🗄️ Convex Reactive Database Schemas (`convex/schema.ts`)

1. `meetings`: Meeting metadata, audio URLs, transcript status, workspace IDs.
2. `extractedFacts`: Raw facts extracted by specialized agency crew agents.
3. `knowledgePackages`: Verified consensus knowledge packages with 3-hash manifests.
4. `graphNodes`: Workspace objects (Tasks, Decisions, Risks, Meetings, Documents).
5. `graphEdges`: Typed directed relationships with topology metadata.
6. `workspaceTimeline`: Event stream, state transitions, cognitive debt alerts.
7. `auditLogs`: Security, identity, and data access audit trail.
8. `views`: Active layout views and saved workspace projections.
9. `userMetadata`: User preferences, identity mapping, tenant permissions.

---

## 🔌 External Integrations & Connectors

* **Model Providers**: OpenAI (`openai`), Anthropic (failover), Local Ollama / vLLM.
* **Hand-Off Targets**: Jira (REST API), Linear (GraphQL), GitHub (Octokit / REST), Azure DevOps (REST), Slack (Block Kit / Webhooks).
* **Identity Provider**: Clerk (`@clerk/nextjs`) + Bearer token security adapter.
* **Observability**: OpenTelemetry (`@opentelemetry/api`), AegisOS Kernel Adapter.
