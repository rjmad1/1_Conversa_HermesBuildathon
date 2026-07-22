# 03 — Project Memory

- **Platform Name**: Conversa
- **Repository Root**: `c:\Users\rajaj\Projects\1_Conversa`
- **Last Synchronized**: 2026-07-23T05:10:00+05:30

---

## 🧠 Architectural Insights & Lessons Learned

### 1. Audio-First Extraction vs. Text Summarization
* **Insight**: Pure text LLM summarization often misses micro-context, speaker intent, and implicit commitments.
* **Pattern**: Implement a multi-agent extraction pipeline where separate specialized agents analyze discrete facets (`ActionItem`, `DecisionItem`, `RiskItem`) with line-level transcript evidence anchoring before passing items into a consensus blackboard.

### 2. Multi-Provider Capability Failover
* **Insight**: Hardcoding a single LLM API creates severe vulnerability to rate limits, regional outages, and quota exhausts.
* **Pattern**: Wrap model invocations in a `FailoverRouter` (`src/modules/analysis/failover-router.ts`). When primary provider fails, failover executes seamlessly while emitting structured warnings for observability.

### 3. Cryptographic Lineage (3-Hash Verification)
* **Insight**: Enterprise compliance requires proof that published executive summaries match actual raw transcript inputs without LLM hallucination.
* **Pattern**: Compute `semanticHash` (vector embedding hash), `contentHash` (sha256 of text), and `provenanceHash` (sha256 of source audio/transcript line references) into every published package manifest.

### 4. Living Graph Cycle Prevention
* **Insight**: Interdependent tasks and decisions in a workspace can form deadlocked cycles if graph edges are added arbitrarily.
* **Pattern**: Enforce directed acyclic graph (DAG) cycle checking (`src/modules/graph/graph-engine.ts`) prior to persisting edge relationships.

---

## 🛠️ Code Conventions & Developer Standards

1. **Strict TypeScript Typing**: No `any` types permitted. All domain models defined with explicit interfaces (`src/platform/contracts`) and Zod schemas.
2. **Error Handling**: Wrap external network and LLM provider calls in try/catch blocks; return structured error objects with actionable diagnostic context instead of throwing unhandled rejections.
3. **Observability First**: Emit structured JSON logs via `src/shared/logging/logger.ts` with timestamp, severity level, message, and redacted sensitive metadata.
4. **Test-Driven Rigor**: Ensure every functional capability is covered by unit or integration tests under `tests/`.
