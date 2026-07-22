# 19 — Test Catalog

- **Platform Name**: Conversa Test Suite
- **Repository Root**: `c:\Users\rajaj\Projects\1_Conversa`
- **Last Synchronized**: 2026-07-23T05:10:00+05:30

---

## 🧪 Test Suite Inventory & Verification Report

- **Test Runner Framework**: Vitest v4.1
- **Total Test Files**: 49
- **Total Executed Tests**: 229
- **Passing Status**: 🟢 229 / 229 Passed (100%)

---

## 📋 Comprehensive Test File Breakdown

| Test Suite Category | File Path | Tests Passed | Target Functionality Covered |
| :--- | :--- | :---: | :--- |
| **Product Maturity 100%** | `tests/unit/maturity-100.spec.ts` | 4 | A2A Agent Negotiation, Zero-Touch Join Bot, Vector RAG Search |
| **Native Hand-Off Adapters** | `tests/unit/integrations/hand-off-connectors.spec.ts` | 10 | Jira, Linear, GitHub, Azure DevOps, Slack dispatching |
| **LLM Model Failover** | `tests/integration/failover.spec.ts` | 1 | Capability-aware fallback from OpenAI to Anthropic |
| **Interaction Intelligence**| `tests/unit/interaction-intelligence.spec.ts` | 10 | AegisOS Kernel Adapter, explainability traces, cognitive metrics |
| **Living Workspace Graph** | `tests/unit/living-workspace.spec.ts` | 8 | Graph topology, cycle prevention, timeline engine |
| **Workspace Graph Functions** | `tests/unit/graph.spec.ts` | 7 | Graph nodes, typed directed edges, depth traversals |
| **Managed Agency Crew** | `tests/unit/agency/agency.spec.ts` | 5 | Agent runner, Action/Decision/Risk extraction |
| **Convex Views Engine** | `tests/unit/views.spec.ts` | 4 | Reactive saved views, projection filters |
| **Workspace OS Engine** | `tests/unit/workspace-os.spec.ts` | 8 | Spatial workspace isolation, event triggers |
| **Knowledge Engine** | `tests/unit/knowledge.spec.ts` | 3 | `ValidatedKnowledgePackage` serialization & privacy |
| **Metadata Store** | `tests/unit/metadata.spec.ts` | 3 | Key-value schema validation and metadata operations |
| **Diagnostic Logger** | `tests/unit/logger.spec.ts` | 4 | Redaction of sensitive payload keys in structured logs |
| **37 Additional Suites** | `tests/unit/**/*`, `tests/integration/**/*` | 152 | Subsystem integration, API contracts, domain validation |

---

## 🏃 Execution Command
```bash
npx vitest run
```
