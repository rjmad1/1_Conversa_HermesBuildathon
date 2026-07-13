# Conversa — Coding Conventions & Standards

---
### 📋 Document Metadata
- **Purpose**: Defines development standards, typing rules, naming schemas, error handling, and testing metrics.
- **Audience**: Backend developers, frontend engineers, and code reviewers.
- **Last Generated**: 2026-07-13T05:20:47+05:30
- **Confidence Level**: High (Directly reconciled with existing ESLint configurations and typescript setups).
- **Evidence Used**: ESLint configuration, typescript configurations, and test files.
- **Cross References**: See [MODULES.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/MODULES.md), [WORKFLOWS.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/WORKFLOWS.md).
- **Open Questions**: Rotation policy for static Bearer tokens.
- **Known Limitations**: Ephemeral DB locks limit developer validation cycles.
- **Recommended Next Actions**: Enforce TLS and HTTPS verification at deployment gateway.
---

## 1. Type Safety & Validation Rules
* **TypeScript Strictness**: Enforce strict compile flags (`tsc --noEmit`). Avoid using the `any` keyword unless absolutely necessary (such as mock testing overlays).
* **Zod Schemas**: Every external payload entering Hono routers must be validated using corresponding Zod schemas defined in `schemas.ts` before hitting domain handlers.
* **Separation of Concerns**: Domain entities and business logic must remain completely decoupled from the Hono API framework.

---

## 2. Naming Conventions

* **Files & Directories**: Use kebab-case for all files (e.g., `run-meeting-agency.ts`) and subdirectories.
* **Classes**: PascalCase (e.g., `ProdIdentityAdapter`).
* **Functions & Methods**: camelCase with verb-noun structures (e.g., `resolveRole`, `estimateCost`).
* **Variables & Properties**: camelCase (e.g., `totalInputTokens`).
* **Constants**: SCREAMING_SNAKE_CASE (e.g., `AUDIO_MAX_BYTES`).

---

## 3. Error Handling Policies

All operational errors must throw instances of `AppError` carrying a specific `ErrorCode` and HTTP status code:
```typescript
throw new AppError(ErrorCode.VALIDATION_ERROR, "Missing audio file", 400);
```

### Centralized Exception Catching
- The global router onError handler (`app.onError`) intercepts all uncaught exceptions, generates correlation IDs, and logs errors in structured JSON.
- Raw stack traces are never exposed in production HTTP responses.

---

## 4. Testing Standards
- **Unit Coverage**: 100% code coverage on schema validators, helpers, and config building.
- **Integration Assertions**: Isolation boundaries must be verified under adversarial mock headers (wrong workspace/tenant access must throw HTTP 403 or 404).
- **Mock Interfaces**: Rely on swappable provider factory bindings (`fake` vs. `openai`) to run local testing suites offline without invoking paid external model APIs.
