# Architecture Explainer

## Current architecture (implemented)
- Frontend: Vite SPA
- Backend: Hono API
- Use cases in application layer
- Domain contracts for providers/repositories
- In-memory repositories + storage abstraction
- Fake/OpenAI provider adapters
- Structured logging + recursive redaction
- Verification: Vitest (unit/integration/e2e), adversarial runner, smoke test

### 1) System Context (current)
```mermaid
flowchart LR
  U[User/Judge] --> UI[Vite Frontend]
  UI --> API[Hono API]
  API --> UC[Application Use Cases]
  UC --> REPO[In-memory Repositories]
  UC --> ST[Storage Abstraction]
  UC --> TP[Transcription Provider Adapter]
  UC --> AP[Analysis Provider Adapter]
  UC --> AUD[Audit Event Stream]
```

### 2) Transcript Analysis Flow
```mermaid
sequenceDiagram
  participant UI
  participant API
  participant UC as Analyze Use Case
  participant TP as Transcript Input
  participant AP as Analysis Provider
  participant R as Repositories

  UI->>API: submit transcript
  API->>UC: validate & process
  UC->>AP: analyze transcript
  AP-->>UC: summary/decisions/risks/actions
  UC->>R: persist analysis + actions
  UC->>R: append audit event
  UC-->>API: structured result
  API-->>UI: response
```

### 3) Approval & Audit Flow
```mermaid
sequenceDiagram
  participant UI
  participant API
  participant AC as Approval Use Case
  participant R as Repositories

  UI->>API: approve/reject action
  API->>AC: scoped action lookup
  AC->>R: mutate action state
  AC->>R: record approval/rejection event
  API-->>UI: status update + correlation
```

### 4) Tenant/Workspace Boundary
```mermaid
flowchart TD
  Req[Request Headers/Identity Context] --> Scope[Tenant + Workspace Scope]
  Scope --> RepoCheck[Repository Boundary Checks]
  RepoCheck --> Allow[Scoped Access]
  RepoCheck --> Deny[Not Found / Denied]
```

### 5) Provider Abstraction
```mermaid
flowchart LR
  UC[Use Cases] --> IF[Provider Interfaces]
  IF --> FP[Fake Providers]
  IF --> OP[OpenAI Adapters]
```

### 6) Test & Verification Architecture
```mermaid
flowchart LR
  UT[Unit Tests] --> CI[Vitest]
  IT[Integration Tests] --> CI
  E2E[E2E Tests] --> CI
  ADV[Adversarial Runner] --> EV[Security Evidence]
  SMK[Smoke Test] --> EV
```

## Future enterprise architecture — planned, not implemented
- Durable DB/object storage
- Production identity and authorization
- Connector layer for Jira/Slack/Salesforce/meeting platforms
- Monitoring/analytics and operational controls
