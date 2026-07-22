# Developer Guide

> **Current-state notice:** Conversa is an active MVP prototype. It contains incomplete, experimental, mocked, and security-remediation work. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

This document provides a comprehensive developer guide for builders extending or maintaining the Conversa codebase.

---

## 1. Prerequisites
* **Node.js**: Version 18 or higher (Node 20+ recommended).
* **Package Manager**: `npm` (npm 9+).
* **Operating System**: macOS, Linux, or Windows (10/11) with powershell/bash.

---

## 2. Repository Structure
```text
├── docs/                      # Architectural, UX, and operational guides
│   └── wiki/                  # Source files synchronized to GitHub Wiki
├── src/
│   ├── app/                   # App composition and API routing (Hono router)
│   ├── infrastructure/        # Repositories, providers, storage implementations
│   ├── modules/               # Domain boundaries, context, and use cases
│   │   ├── meetings/          # Meeting aggregates and operations
│   │   ├── media/             # Audio asset ingestion and binary storage
│   │   ├── transcription/     # Speech-to-Text provider adapter mapping
│   │   ├── analysis/          # Transcript analysis and insight generation
│   │   ├── approvals/         # Action state management approvals/rejections
│   │   └── audit/             # Chronological append-only auditing
│   ├── shared/                # Security adapters, validators, common errors, config
│   └── ui/                    # Frontend client SPA application (Vite SPA)
└── tests/
    ├── unit/                  # Local isolated unit validations
    ├── integration/           # Scoped full-flow module integrations
    └── e2e/                   # Simulated HTTP endpoint boundary calls
```

---

## 3. Installation
Clone the repository and run:
```bash
npm ci
```
This performs a clean install of all pinned dependencies.

---

## 4. Environment Setup
Copy the example environment template:
```bash
cp .env.example .env
```
Fill out the keys as needed:
* `PORT` (Default: `3000`)
* `AUTH_MODE` (Default: `headers`)
* `TRANSCRIPTION_PROVIDER` (`fake` or `openai`)
* `ANALYSIS_PROVIDER` (`fake` or `openai`)

---

## 5. Local Development
Run the local dev environment (Vite SPA on port 3000 serving backend + frontend):
```bash
npm run dev
```

---

## 6. Build Commands
To check type safety and compile production assets into `dist/`:
```bash
npm run build
```

---

## 7. Test Commands
Execute individual verification test suites:
* **Unit Tests**: `npm run test`
* **Integration Tests**: `npm run test:integration`
* **End-to-End Tests**: `npm run test:e2e`
* **Adversarial / Pentest Audits**: `npx vite-node security-audit-artifacts/remediation-verification/adversarial-runner.ts`
* **Smoke verification**: `npx vite-node security-audit-artifacts/remediation-verification/smoke-test.ts`

---

## 8. Architecture Overview
Conversa is a monolithic Hono API with a single-page HTML client:
1. **Frontend Layer**: `src/ui/` compiles using Vite SPA. Communicates with same-origin `/api/v1` routes.
2. **API Routing**: `src/app/index.ts` uses Hono to route HTTP requests.
3. **Application Modules**: Modular use cases process business logic using domain entities.
4. **Infrastructure Layer**: Mapped interfaces for persistent databases (`InMemoryRepo`), audio binaries (`InMemoryAudioStorage`), and third-party AI services (`Fake`/`OpenAI` adapters).

---

## 9. Adding a Route
1. Open [index.ts](https://github.com/rjmad1/1_Conversa_Hermes/blob/main/src/app/index.ts).
2. Register the route under the `v1` Hono sub-router (e.g., `v1.post("/my-endpoint", ...)`).
3. Instantiate and invoke the relevant application Use Case inside the router block, feeding the `ctx(c)` application context.

---

## 10. Adding a Use Case
1. Identify the module folder (e.g., `src/modules/meetings/application`).
2. Create a use case class (e.g. `DoSomething.ts`).
3. Accept `AppContext` in the constructor.
4. Implement `async execute(input: InputType, correlationId: string): Promise<ResultType>`.
5. Call repositories, record audits, and log outcome status.

---

## 11. Adding a Repository Implementation
1. Add custom methods to the domain interface in `src/modules/meetings/domain/repositories.ts`.
2. Implement those methods inside the target repository class (e.g. `InMemoryMeetingRepo` in `src/infrastructure/repositories/in-memory.ts`).
3. **Important**: Always validate tenant and workspace boundaries during retrieval.

---

## 12. Adding a Provider
1. Define the service interface in the target domain module.
2. Implement the interface inside `src/infrastructure/providers/` (e.g., a custom AI service).
3. Register the new provider class inside the provider factory `src/infrastructure/providers/factory.ts`.

---

## 13. Adding Tests
* Create unit tests under `tests/unit/` naming them `<module>.spec.ts`.
* Create integration flows under `tests/integration/`.
* Mock environment dependencies using `makeContext` and `makeIdentity` test helpers inside `tests/helpers.ts`.

---

## 14. Tenant/Workspace Invariants
* Every business resource must be isolated by a unique combination of `tenantId` and `workspaceId`.
* Database lookup queries MUST include scope matching:
  ```typescript
  return entity && entity.tenantId === tenantId && entity.workspaceId === workspaceId ? entity : null;
  ```
* Cross-tenant references must fail closed, returning `null` or raising `404 Not Found` without disclosing record existence.

---

## 15. Error-Handling Conventions
* Never leak internal exception details to the user.
* Wrap predictable errors inside `AppError` throwing descriptive error codes (e.g. `ErrorCode.VALIDATION_ERROR`, `ErrorCode.MEETING_NOT_FOUND`).
* Hono's `app.onError` catches unhandled exceptions, logs them with correlation IDs, and sanitizes outgoing responses.

---

## 16. Logging and Redaction Rules
* Log in structured JSON format using `logger.info`, `logger.warn`, or `logger.error`.
* Pass a log context object as the first parameter.
* All log inputs are passed through `redact` recursively. Sensitive variables (like passwords, keys, transcripts, or audio bytes) are automatically replaced with `[REDACTED]`.

---

## 17. Commit Conventions
Use semantic commit messages:
* `feat`: new features.
* `fix`: bug fixes.
* `refactor`: readable code modifications without feature additions.
* `docs`: documentation corrections.
* `chore`: updates to dev configurations.

---

## 18. Pull-Request Checklist
- [ ] TypeScript typecheck passes.
- [ ] Linter is clean (`npm run lint`).
- [ ] All tests pass successfully (`npm run test:integration`, etc.).
- [ ] Security boundaries (tenant/workspace) are fully verified and verified.
- [ ] No local absolute file paths remain.

---

## 19. Deployment Workflow
* Deployments are handled via Git integration.
* Pushing to the production `main` branch triggers an automated build on Vercel.
* Vercel builds the client bundle using `npm run build` and serves static files. API endpoints map to the frontend router configuration.

---

## 20. Troubleshooting
* **TypeError on undefined content**: Occurs if `SubmitMeetingTranscript` receives a payload lacking the `content` field. Remediated by input guards.
* **404 on API requests**: Ensure Vercel projects include `vercel.json` rewrite settings, mapping `/api/(.*)` to `/api/$1`.
* **Port Conflict**: If port 3000 is occupied, set `PORT` in `.env` to another value (e.g., `PORT=3001`).
