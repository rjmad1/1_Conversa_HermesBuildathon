# Conversa — Codebase Folder Structure

---
### 📋 Document Metadata
- **Purpose**: Describes the folder hierarchy, code ownership boundaries, purposes, and module locations.
- **Audience**: Onboarding developers, software architects, and QA leads.
- **Last Generated**: 2026-07-13T05:20:47+05:30
- **Confidence Level**: High (Directly verified by listing directory tree).
- **Evidence Used**: Workspace directories structure.
- **Cross References**: See [ARCHITECTURE.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/ARCHITECTURE.md), [CODE_GUIDELINES.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/CODE_GUIDELINES.md).
- **Open Questions**: None.
- **Known Limitations**: Ephemeral DB locks limit verification of glossary terms in external systems.
- **Recommended Next Actions**: Enforce TLS and HTTPS verification at deployment gateway.
---

## 1. Directory Tree Map

```text
conversa/
├── .github/              # GitHub CI/CD Actions
├── api/                  # Vercel entry points and esbuild output
├── docs/                 # Documentation hub
│   ├── adr/              # Architectural Decision Records
│   └── roadmap/          # Roadmap execution plans
├── evaluation/           # Agency testing and evaluation runner
├── src/                  # Source Code
│   ├── app/              # REST router and middlewares
│   ├── infrastructure/   # Repositories and external provider implementations
│   ├── modules/          # Core business domain models and use cases
│   ├── shared/           # Common utilities (logs, validation, security)
│   └── ui/               # Frontend client SPA code
└── tests/                # Testing suites (unit, integration, e2e)
```

---

## 2. Directory Specifications

### 2.1 API Entry points (`api/`)
* **Purpose**: Holds Vercel handler scripts.
* **Contents**: `server.ts`, compiled `index.js`.
* **Risk**: Low. Must match bundler targets.

### 2.2 Documentation Hub (`docs/`)
* **Purpose**: Contains the enterprise knowledge base.
* **Contents**: Architectural files, requirements catalogs, SRE runbooks, and roadmaps.
* **Risk**: Low. Must be kept up to date.

### 2.3 Evaluation Runner (`evaluation/`)
* **Purpose**: Auto-evaluates agency metrics across 25 synthetic cases.
* **Contents**: `run-eval.ts` and `cases.ts`.
* **Risk**: Low. Critical release gate.

### 2.4 App Framework Router (`src/app/`)
* **Purpose**: Sets up the Hono instance and security middlewares.
* **Contents**: `index.ts`.
* **Risk**: Medium. Boundary validations live here.

### 2.5 Business Modules (`src/modules/`)
* **Purpose**: Domain models, interfaces, and coordinators.
* **Subfolders**: `meetings`, `media`, `transcription`, `analysis`, `approvals`, `audit`, `agency`.
* **Risk**: High. Contains the core logic.

### 2.6 Shared Services (`src/shared/`)
* **Purpose**: Logging, configuration parses, error handling, rate limiting, and Zod validations.
* **Risk**: High. Tenant isolation guards and logger redactions are configured here.
