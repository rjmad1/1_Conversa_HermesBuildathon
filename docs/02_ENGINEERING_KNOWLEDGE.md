# 02 — Engineering Knowledge

- **Platform Name**: Conversa Platform Core
- **Repository Root**: `c:\Users\rajaj\Projects\1_Conversa`
- **Last Synchronized**: 2026-07-23T05:10:00+05:30

---

## 🏗️ Technical Architecture Overview

Conversa is engineered as a decoupled, multi-tier TypeScript application leveraging Next.js 16 App Router for spatial UI, Convex for reactive real-time state persistence, Hono for REST API endpoints, and a structured 4-phase cognitive processing engine inside `src/modules/*`.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js 16 UI Shell                             │
│       (Spatial Shell, Command Surface, Cognitive Animations)           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 Hono REST API & Convex Reactive Layer                  │
│       (HTTP Routes, Reactive Subscriptions, Schema Validation)          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                Phase 1: Enterprise Cognitive Pipeline                  │
│   (Capability Router, OpenAI/Anthropic Failover, Managed Agency Crew)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               Phase 2: Cognitive Collaboration Engine                  │
│   (Evidence Blackboard, Multi-Agent Debate, Consensus Generator)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             Phase 3: Enterprise Knowledge Publishing Layer              │
│  (Audience Publishers, Serializers, 3-Hash Cryptographic Lineage)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Phase 4: Living Workspace Layer                      │
│   (Knowledge Graph, Workspace Timeline, Vector RAG, Native Hand-Offs)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Subsystem Breakdown

### 1. Enterprise Cognitive Meeting Pipeline (`src/modules/analysis`, `src/modules/agency`)
- **Capability-Aware Router**: Evaluates LLM provider candidates based on payload size, confidentiality rules, and execution costs.
- **Failover Controller**: Automatic fallback from primary model (`openai`) to secondary model (`anthropic`) with rate-limit recovery.
- **Agency Crew**: Runs autonomous extraction agents: `ActionExtractor`, `DecisionExtractor`, `RiskExtractor`, `DiarizationAgent`, and `LinkupGroundingAgent`.

### 2. Cognitive Collaboration Engine (`src/modules/cognitive-collaboration`)
- **Evidence Repository**: Multi-indexed blackboard capturing raw claims, transcript spans, and confidence levels.
- **Debate Coordinator**: Detects claim overlaps/contradictions across agents, computes weighted consensus, and generates cognitive debt alerts.
- **Consensus Engine**: Renders unified `ValidatedKnowledgePackage` objects with validated privacy boundaries.

### 3. Enterprise Knowledge Publishing Layer (`src/modules/knowledge-publishing`)
- **Audience Publishers**: Produces Executive Summaries, Engineering Minutes, Action Registers, Decision Registers, and Stakeholder Briefs.
- **Serializers**: Markdown, JSON, HTML, PlainText.
- **3-Hash Lineage Verification**: Renders cryptographic manifests (`semanticHash`, `contentHash`, `provenanceHash`).

### 4. Living Workspace Layer (`src/modules/living-workspace`, `src/modules/graph`, `src/modules/integrations`)
- **Living Knowledge Graph**: Maintains typed nodes (`Task`, `Decision`, `Risk`, `Meeting`, `Document`) and relationships (`DependsOn`, `ExtractedFrom`, `References`).
- **Timeline Engine**: Tracks state transitions, detects stale objects and unassigned risks.
- **Native Hand-Off Engine**: Dispatches work items to Jira, Linear, GitHub, Azure DevOps, and Slack.

---

## 🛠️ Technology Stack & Libraries

* **Framework**: Next.js 16 (React 19, Turbopack)
* **Backend Database & Reactive Engine**: Convex (`convex/schema.ts`)
* **API Server**: Hono (`api/server.ts`, `@hono/node-server`)
* **UI Components & Styling**: Tailwind CSS v4, Lucide React, Framer Motion, cmdk
* **Validation & Types**: TypeScript v5.7, Zod v3.23
* **Testing Suite**: Vitest v4.1 (49 test files, 229 passing tests)
* **Authentication**: Clerk (`@clerk/nextjs`, `@clerk/clerk-js`) with bearer token fallback adapter
