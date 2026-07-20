# Conversa — Enterprise Cognitive Meeting & Living Workspace Platform

---
### 📋 Document Metadata
- **Purpose**: Canonical human-builder entry point, enterprise system architecture summary, setup instructions, and documentation index.
- **Audience**: All stakeholders, engineers, architects, security auditors, and AI assistants.
- **Last Generated**: 2026-07-20T06:54:00+05:30
- **Confidence Level**: Verified (Derived directly from functional codebase, 174 passing vitest suites, and `tsc --noEmit` typecheck).
- **Evidence Used**: Server runtime (`src/app/index.ts`), Next.js 16 UI Shell (`app/workspace/page.tsx`), Convex Backend (`convex/`), and 4 Enterprise Architectural Modules (`src/modules/*`).
- **Cross References**: See `/docs` index directory below.
---

Conversa turns meeting audio and text into deterministic, governed, audience-specific outputs and actionable knowledge. Built on an **audio-first enterprise cognitive architecture**, Conversa processes meeting audio and transcripts through specialized AI agents, multi-agent debate and consensus generation, 3-hash cryptographic lineage publication, and a dynamic living workspace knowledge graph.

---

## 🚀 Core Platform Architecture (Phases 1 – 4)

Conversa is architected into four cohesive enterprise layers:

### Phase 1: Enterprise Cognitive Meeting Pipeline
* **Capability-Aware Router**: Dynamically routes extraction tasks (`ActionItem`, `DecisionItem`, `RiskItem`, `Diarization`) based on provider capabilities, cost metrics, quality tiers, and privacy constraints (`Public`, `Internal`, `Confidential`, `Restricted`, `Regulated`).
* **Multi-Provider Failover**: Automatic fallback between primary (OpenAI) and secondary (Anthropic / Local) models with rate-limit recovery and execution metrics.
* **Managed Meeting Agency Crew**: Orchestrates specialized extraction agents, Linkup web grounding verification, quality claim validation, and human-in-the-loop manual approval gates.

### Phase 2: Cognitive Collaboration Engine
* **Evidence Repository**: Multi-indexed evidence blackboard tracking raw extracted facts, speaker claims, context snippets, and transcript line numbers.
* **Debate Coordinator & Validation Engine**: Runs cross-agent validation, detects contradictions/overlaps, computes multi-dimensional confidence scores (evidence, provenance, validation, agreement, governance), and flags cognitive debt.
* **Consensus Generator**: Synthesizes verified claims into canonical `ValidatedKnowledgePackage` domain models with strict privacy guardrails and data residency rules (`US`, `EU`, `India`, `Global`, `CustomerManaged`, `AirGapped`).

### Phase 3: Enterprise Knowledge Publishing Layer
* **Semantic Publication Bus**: Deterministically generates audience-tailored artifacts from `ValidatedKnowledgePackage` models.
* **Specialized Publishers**: Executive Summaries, Engineering Minutes, Action Registers, Decision Registers, Risk Registers, Stakeholder Briefs, and Machine-Readable Packages.
* **Multi-Format Serializers**: Renders publications to Markdown, JSON, HTML, and PlainText formats.
* **3-Hash Lineage Verification**: Every publication manifest includes a cryptographic 3-hash lineage verification model (`semanticHash`, `contentHash`, `provenanceHash`) ensuring auditability and zero hallucination.

### Phase 4: Living Workspace Layer
* **Living Knowledge Graph**: Maintains objects (`Task`, `Decision`, `Risk`, `Meeting`, `Document`), typed relationships (`DependsOn`, `ExtractedFrom`, `References`), backlink indices, and topology cycle prevention policies.
* **Workspace Timeline & Health Engine**: Real-time event tracking, stale knowledge detection, unassigned risk monitors, and cognitive debt alerts.
* **Recommendation & Evolution Engine**: Automated workspace restructuring, relationship suggestions, and active view projections.

---

## 🎨 User Interface & Persistence Integrations

* **Next.js 16 App Router UI**: Modern Spatial Shell (`components/layout/spatial-shell.tsx`), Command Surface (`components/layout/command-surface.tsx`), Mobile Workspace layout (`components/layout/mobile-workspace.tsx`), and Framer Motion cognitive animations (`components/motion/cognitive-motion.tsx`).
* **Convex Serverless Backend**: Real-time reactive schemas and functions (`convex/schema.ts`, `convex/meetings.ts`, `convex/graph.ts`, `convex/knowledge.ts`, `convex/metadata.ts`, `convex/search.ts`, `convex/views.ts`).

---

## 📢 Public Release Disclosures

* **Security & Governance**: Identity adapter with bearer token enforcement, tenant/workspace boundary isolation, BOLA protection, payload size limits, and deep recursive JSON log redaction.
* **Data Privacy**: Privacy levels (`Public`, `Internal`, `Confidential`, `Restricted`, `Regulated`) automatically enforced prior to blackboard storage and artifact publishing.
* **Supported Inputs**: MP3 (`audio/mpeg`), WAV (`audio/wav`), M4A (`audio/mp4`), or synthetic pasted/imported transcripts.

---

## 🛠️ Setup & Execution

### Prerequisites
* Node.js (v20 or higher recommended)
* npm

### Installation & Verification
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm ci
   ```
3. Typecheck codebase (0 errors required):
   ```bash
   npm run typecheck
   ```
4. Run all unit and integration test suites (174 tests across 42 files):
   ```bash
   npx vitest run
   ```
5. Start development environment:
   ```bash
   npm run dev
   ```

---

## 📚 Documentation Directory Index

Explore the comprehensive enterprise knowledge base in [/docs](file:///c:/Users/rajaj/Projects/1_Conversa/docs):

* [PROJECT.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/PROJECT.md) — Business vision, goals, and success metrics.
* [ARCHITECTURE.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/ARCHITECTURE.md) — Technical containers, sequence, and system data flows.
* [IMPLEMENTATION_STATUS.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/IMPLEMENTATION_STATUS.md) — Phase 1–4 matrix and capability readiness scorecards.
* [MODULES.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/MODULES.md) — Complete module directory boundaries and interface definitions.
* [API.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/API.md) — REST & Hono endpoints, payload schemas, and error handling contracts.
* [DECISIONS.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/DECISIONS.md) — Architectural Decision Records (ADRs) table and rationale.

---

## ⚖️ License

Conversa is distributed under the MIT License. See [LICENSE](LICENSE) for details.
