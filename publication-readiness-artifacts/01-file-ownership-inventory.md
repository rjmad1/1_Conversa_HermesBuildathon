# Phase 1 - File Ownership Inventory

This document maps repository files to their originating and modifying agents, ensuring that parallel-work rules are maintained and HERMES work is protected.

## 1. Core Production Source Code (HERMES Owned)

These are the primary business logic and domain modules. Antigravity did not modify these, except for applying required security boundaries and redaction hooks.

* **Domain & Application Services**:
  * [src/modules/meetings/](file:///c:/Users/rajaj/Projects/1_Conversa/src/modules/meetings/) - Core meeting creation and retrieval.
  * [src/modules/media/](file:///c:/Users/rajaj/Projects/1_Conversa/src/modules/media/) - Audio upload and storage ports.
  * [src/modules/transcription/](file:///c:/Users/rajaj/Projects/1_Conversa/src/modules/transcription/) - Audio transcription routing.
  * [src/modules/analysis/](file:///c:/Users/rajaj/Projects/1_Conversa/src/modules/analysis/) - Transcript AI analysis.
  * [src/modules/approvals/](file:///c:/Users/rajaj/Projects/1_Conversa/src/modules/approvals/) - Action approve/reject services.
  * [src/modules/audit/](file:///c:/Users/rajaj/Projects/1_Conversa/src/modules/audit/) - Domain audit-event querying.
* **Server Framework & Entrypoints**:
  * [src/app/index.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/app/index.ts) - Hono API application router.
  * [src/server.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/server.ts) - Node.js local dev server.
  * [src/worker.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/worker.ts) - Cloudflare Worker gateway entrypoint.

## 2. Infrastructure & Security Adapters (Jointly Modified / Antigravity Audited)

These files implement concrete adapters and security middleware. They were modified by previous Antigravity security remediation sweeps to resolve BOLA and data leaks, and are audited/stabilized in this sweep.

* **Persistence & Storage**:
  * [src/infrastructure/repositories/in-memory.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/repositories/in-memory.ts) - Scoped in-memory database adapters.
  * [src/infrastructure/storage/in-memory.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/storage/in-memory.ts) - In-memory audio binary storage.
* **AI Providers**:
  * [src/infrastructure/providers/fake-transcription.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/providers/fake-transcription.ts) - Mock transcription supplier.
  * [src/infrastructure/providers/openai.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/providers/openai.ts) - OpenAI API adapter.
* **Cross-Cutting Concerns**:
  * [src/shared/security/redaction.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/shared/security/redaction.ts) - Recursive logger redaction.
  * [src/shared/security/identity.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/shared/security/identity.ts) - Development header-to-identity adapter.
  * [src/shared/logging/logger.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/shared/logging/logger.ts) - Portable JSON logging utility.
  * [src/shared/errors/AppError.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/shared/errors/AppError.ts) - Standard application error definitions.

## 3. Test Suites & QA Code (Antigravity Maintained)

* **Adversarial & Isolation Tests** (Created by Antigravity, stabilized in this run):
  * [tests/unit/logger.spec.ts](file:///c:/Users/rajaj/Projects/1_Conversa/tests/unit/logger.spec.ts)
  * [tests/unit/transcription-contract.spec.ts](file:///c:/Users/rajaj/Projects/1_Conversa/tests/unit/transcription-contract.spec.ts)
  * [tests/integration/tenant-isolation.spec.ts](file:///c:/Users/rajaj/Projects/1_Conversa/tests/integration/tenant-isolation.spec.ts)
  * [tests/integration/adversarial.spec.ts](file:///c:/Users/rajaj/Projects/1_Conversa/tests/integration/adversarial.spec.ts)
  * [tests/e2e/tenant-isolation.spec.ts](file:///c:/Users/rajaj/Projects/1_Conversa/tests/e2e/tenant-isolation.spec.ts)
* **Functional & Flow Tests** (Created by HERMES):
  * [tests/unit/validation.spec.ts](file:///c:/Users/rajaj/Projects/1_Conversa/tests/unit/validation.spec.ts)
  * [tests/integration/flow.spec.ts](file:///c:/Users/rajaj/Projects/1_Conversa/tests/integration/flow.spec.ts)
  * [tests/e2e/api.spec.ts](file:///c:/Users/rajaj/Projects/1_Conversa/tests/e2e/api.spec.ts)

## 4. Documentation & Audits (Audited by Antigravity Tenthgate)

* **Baseline Requirements**: `Requirements/Requirements/` (Product & MVP specifications)
* **Security Audits**: `security-audit-artifacts/` (Pre-existing validation registers)
* **Quality & Benchmarks**: `quality-artifacts/` (HERMES-owned QA files)
* **Release Docs**: `docs/` and `docs/wiki/` (Polished and synchronized in this audit)
* **Publication Artifacts**: `publication-readiness-artifacts/` (Antigravity Tenthgate outputs)
