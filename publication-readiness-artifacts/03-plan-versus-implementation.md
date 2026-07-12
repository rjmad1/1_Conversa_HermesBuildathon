# Phase 3 - Plan versus Actual Reconciliation

This document reconciles the differences between the various product visions and the actual code in the repository, defining the canonical current-state architecture.

## 1. Plan vs. Implementation Contradictions

The repository documentation references a few different architectural layers and products (e.g. Next.js, Slack integrations, Convex memory). We reconcile these here:

| Plan / Document Claim | Actual Codebase Implementation | Discrepancy & Status |
|:---|:---|:---|
| **Next.js 14+ / Vercel Edge Serverless Monolith** (from `Conversa_Detailed_Implementation_Plan.md`) | A single-page client built with **Vite** (`vite.config.ts`) and a **Hono** backend router served in Node or Cloudflare Worker mode (`src/worker.ts`). | **Complete architectural change.** The stack was moved from Next.js to Hono + Vite SPA. There are no Next.js files or Next.js edge API routes. |
| **No authentication / multi-tenancy in MVP** (from `Conversa_Detailed_Implementation_Plan.md`) | Core repositories and application use cases enforce **multi-tenancy scoping** (`tenantId`, `workspaceId`) on every read and write. | **Scope expansion.** Multi-tenancy isolation was added in development-adapter form (using `DevIdentityAdapter`). |
| **Convex memory, Cloudflare D1 persistence, R2 storage** (referenced in requirements and `env.ts`) | **Fully hardcoded in-memory persistence** (`buildInMemoryRepos`, `InMemoryAudioStorage`). | **No durable database.** The code has Zod environment flags for `PERSISTENCE_BACKEND=d1` and `STORAGE_BACKEND=r2`, but the actual repository factory and server setup *completely ignore* these variables. Only `in-memory` repositories and storage exist in code. |
| **Partner Integrations** (Slack, Jira, Salesforce, Wispr, ElevenLabs, Dodo Payments, Linkup, Zoom, Teams, Meet) | **Zero integration code exists.** | **Planned only.** There are no files, models, or APIs referencing external partner systems. All analyses and actions stay within the local in-memory system. |
| **Real-time meeting ingestion** | **Post-meeting batch file upload or pasted transcript only.** | **Batch-only.** Real-time streaming or hook-based transcription does not exist. |

## 2. Canonical Current-State Architecture

The actual codebase is structured as a **clean domain-driven vertical-slice monolith** using:
1. **Frontend Client (SPA)**:
   - Written in Vanilla TypeScript ([src/ui/ui.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/ui/ui.ts)) and HTML/CSS ([src/ui/index.html](file:///c:/Users/rajaj/Projects/1_Conversa/src/ui/index.html)).
   - Interacts with same-origin HTTP API endpoints via standard `fetch`.
   - Bundled via **Vite** to static files in `/dist`.
2. **Backend API Router (Hono)**:
   - Configured in [src/app/index.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/app/index.ts).
   - Serves API routes (`/api/v1/*`) and static front-end assets.
3. **Application Layer (Use Cases)**:
   - Segmented into clean modules: `meetings`, `media`, `transcription`, `analysis`, `approvals`, `audit`.
   - Use cases depend on abstract domain ports (e.g. `MeetingRepository`, `AudioTranscriptionProvider`).
4. **Infrastructure Layer (Adapters)**:
   - Concrete in-memory database and storage adapters: `InMemoryMeetingRepo`, `InMemoryAudioStorage`, etc.
   - External providers: `FakeTranscriptionProvider` (default mock) and `OpenAIAnalysisProvider` / `OpenAITranscriptionProvider` (standard OpenAI API wrapper).
5. **Security Isolation & Boundary Enforcement**:
   - `DevIdentityAdapter` extracts `x-tenant-id`, `x-workspace-id`, and `x-actor-id` headers from incoming HTTP requests.
   - These are passed down through the AppContext and enforced at the database repository level to filter records.
   - Portable `logger` redacts sensitive fields recursively up to 10 nested levels using the `redact` utility.
