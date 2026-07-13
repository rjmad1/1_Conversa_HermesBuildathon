# Conversa — Lessons Learned & Engineering Insights

---
### 📋 Document Metadata
- **Purpose**: Gathers architectural insights, discovered anti-patterns, code audit learnings, and design decisions.
- **Audience**: Backend engineers, software architects, and QA leads.
- **Last Generated**: 2026-07-13T05:20:47+05:30
- **Confidence Level**: High (Reflects engineering trade-offs of the active codebases).
- **Evidence Used**: Core modules, in-memory repository mappings, and sequential agency loops.
- **Cross References**: See [ARCHITECTURE.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/ARCHITECTURE.md), [KNOWN_ISSUES.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/KNOWN_ISSUES.md).
- **Open Questions**: Rotation policy for static Bearer tokens.
- **Known Limitations**: Ephemeral persistence hampers testing.
- **Recommended Next Actions**: Transition static memory repositories to Convex schema definitions.
---

## 1. Discovered Patterns & Anti-Patterns

### 1.1 Anti-Pattern: Sequential Multi-Agent Pipelines
* **Observation**: The agency loop coordinates tasks (Manager -> Decision -> Risk -> Action) sequentially.
* **Impact**: Total request processing time is the sum of LLM latencies ($3\times$ single call), resulting in high latency.
* **Recommendation**: Run specialists concurrently using `Promise.all` and join their output JSON arrays before invoking the final QA Reviewer.

### 1.2 Anti-Pattern: Volatile In-Memory Repository
* **Observation**: Entities are stored in volatile Map arrays.
* **Impact**: System state is cleared on restarts. Concurrency is limited to single thread memory bounds.
* **Recommendation**: Integrate persistent serverless relational databases (Cloudflare D1) or reactive document stores (Convex) in early pilot phases.

### 1.3 Pattern: Centralized Authentication & RBAC Guard
* **Observation**: Enforcing security checking rules directly inside individual route handlers leads to gaps.
* **Success**: hardening the security model with a central `authGuard` and `ProdIdentityAdapter` ensures that all routes are intercepted and validated against mapped tokens.

---

## 2. Historical Remediation Insights

* **JSON Logs Leak Risk**: In early development, raw request payloads were printed directly to logger outputs, risking credential leakage.
  * *Lesson*: Recursive JSON redaction filters are required on all structured log outputs.
* **Whisper Timeout Risk**: 10MB audio files require longer processing windows than standard 15-second serverless execution limits.
  * *Lesson*: Asynchronous queue patterns and long function caps (e.g. Cloudflare Worker limits) are necessary for speech processing boundaries.
