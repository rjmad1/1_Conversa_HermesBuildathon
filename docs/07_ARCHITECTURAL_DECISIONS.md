# 07 — Architectural Decisions

- **Platform Name**: Conversa Platform
- **Repository Root**: `c:\Users\rajaj\Projects\1_Conversa`
- **Last Synchronized**: 2026-07-23T05:10:00+05:30

---

## 🏛️ Architectural Decision Records (ADRs)

### ADR-001: Next.js 16 App Router for Spatial UI Shell
* **Status**: Accepted
* **Context**: Need a responsive, high-performance web interface capable of dynamic spatial navigation, command palette surfaces, and smooth motion transitions.
* **Decision**: Adopt Next.js 16 with React 19, Turbopack, Tailwind CSS v4, and Framer Motion.
* **Trade-Offs**: Requires keeping client-side state synchronized with serverless reactive backend.
* **Impact**: Delivers executive-grade spatial user interface.

### ADR-002: Convex Serverless Backend for Real-Time State Persistence
* **Status**: Accepted
* **Context**: Multi-user living workspace graphs require instant reactivity, websocket updates, and zero-maintenance serverless scalability.
* **Decision**: Use Convex serverless functions and real-time database (`convex/schema.ts`).
* **Trade-Offs**: Requires vendor alignment with Convex query/mutation patterns.
* **Impact**: Eliminates polling overhead and enables instant reactive UI graph updates.

### ADR-003: Multi-Provider Capability Failover Router
* **Status**: Accepted
* **Context**: Meeting extraction relies on LLMs which are subject to API rate limits, transient errors, and provider outages.
* **Decision**: Implement `FailoverRouter` (`src/modules/analysis/failover-router.ts`) with primary (OpenAI) and secondary (Anthropic/Local) execution fallback.
* **Trade-Offs**: Minor latency penalty on primary failure while retry/fallback completes.
* **Impact**: Guarantees 99.9% pipeline resilience during upstream LLM outages.

### ADR-004: Cryptographic 3-Hash Verification Lineage Model
* **Status**: Accepted
* **Context**: Enterprise users require complete auditability to verify that generated summaries match original meeting transcripts.
* **Decision**: Every published artifact includes `semanticHash` (vector embedding), `contentHash` (sha256 of text), and `provenanceHash` (sha256 of line-referenced sources).
* **Trade-Offs**: Additional CPU computation per publication.
* **Impact**: Provides tamper-proof lineage verification and eliminates enterprise compliance friction.

### ADR-005: AegisOS Interaction Intelligence Integration
* **Status**: Accepted
* **Context**: Need standard explainability traces and cognitive performance metrics for agent decision-making.
* **Decision**: Register AegisOS Kernel Adapter (`src/modules/interaction-intelligence/aegis-adapter.ts`) to capture trace spans and cognitive debt signals.
* **Trade-Offs**: Additional telemetry log volume.
* **Impact**: Full auditability into agent-to-agent debate and consensus decisions.
