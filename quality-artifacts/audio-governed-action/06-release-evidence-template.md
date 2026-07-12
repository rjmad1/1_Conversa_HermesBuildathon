# Release Evidence Report Template

This document is the standard template for recording quality, security, and release assurance verification evidence for the Conversa Audio-to-Governed-Action milestone.

> [!IMPORTANT]
> This is a blank template. All evaluation statuses must remain unpopulated prior to active release testing. Use only the following standard evaluations:
> * `PASS`
> * `FAIL`
> * `BLOCKED`
> * `NOT RUN`
> * `NOT APPLICABLE`

---

## 1. Release Identification
* **Commit Reviewed (SHA-1)**: `[Insert Git Commit Hash]`
* **Environment Name / Type**: `[e.g. Local / CI-Pipeline / Staging / Production]`
* **Assessment Date**: `[Insert Date]`
* **Assessor Name / Role**: `[Insert Name and Role]`

---

## 2. Verification Dashboard

| Verification Area | Evaluation | Evidence Reference / Command Output Log |
|---|---|---|
| **Build Command & Result** | `NOT RUN` | `[Paste terminal build logs]` |
| **Lint Check Result** | `NOT RUN` | `[Paste eslint logs]` |
| **Type-Check Result** | `NOT RUN` | `[Paste typescript compilation logs]` |
| **Unit Test Suite** | `NOT RUN` | `[Paste Vitest unit tests execution output]` |
| **Integration Test Suite** | `NOT RUN` | `[Paste Vitest integration tests execution output]` |
| **E2E Test Suite (API Layer)**| `NOT RUN` | `[Paste Vitest E2E tests execution output]` |
| **Security Review** | `NOT RUN` | `[Attach security controls validation logs]` |
| **Accessibility Review** | `NOT RUN` | `[Attach keyboard access & contrast checks log]` |
| **Migration Execution** | `NOT RUN` | `[Paste DB schema / D1 migration logs]` |
| **Rollback Verification** | `NOT RUN` | `[Paste rollback script execution evidence]` |
| **Health Check Validation** | `NOT RUN` | `[Paste liveness and readiness curl responses]` |
| **Traceability Status** | `NOT RUN` | `[Verify 100% of P0 requirements map to scenarios]` |

---

## 3. Verification Details

### Build Verification
* **Evaluation**: `NOT RUN`
* **Build Command run**: `npm run build`
* **Evidence**:
```text
[Insert compiler and bundler output here]
```

### Lint Verification
* **Evaluation**: `NOT RUN`
* **Lint Command run**: `npm run lint`
* **Evidence**:
```text
[Insert eslint CLI logs here]
```

### Type-Check Verification
* **Evaluation**: `NOT RUN`
* **Type-Check Command run**: `npm run typecheck`
* **Evidence**:
```text
[Insert tsc outputs here]
```

### Unit Testing
* **Evaluation**: `NOT RUN`
* **Test Command run**: `npm run test`
* **Evidence**:
```text
[Insert Vitest unit output logs here]
```

### Integration Testing
* **Evaluation**: `NOT RUN`
* **Test Command run**: `npm run test:integration`
* **Evidence**:
```text
[Insert Vitest integration logs here]
```

### E2E Testing
* **Evaluation**: `NOT RUN`
* **Test Command run**: `npm run test:e2e`
* **Evidence**:
```text
[Insert Vitest E2E logs here]
```

### Security & Privacy Controls Verification
* **Evaluation**: `NOT RUN`
* **Control Verification Log**:
```text
[Insert evidence for:
 - Tenant Isolation verification
 - IDOR verification on actions
 - Boundary validations
 - Filename sanitization
 - Log Redaction verification
 - Production mode identity validation]
```

### Accessibility (A11y) Verification
* **Evaluation**: `NOT RUN`
* **A11y Check Log**:
```text
[Insert evidence of keyboard control validation, contrast audits, and verification that no browser webcam prompts occur]
```

### Database Migration Verification
* **Evaluation**: `NOT RUN`
* **Migration Log**:
```text
[Insert D1 / relational DB migrations logs]
```

### Rollback Verification
* **Evaluation**: `NOT RUN`
* **Rollback Log**:
```text
[Insert evidence that applying rollback scripts successfully restores prior schema without data loss]
```

### Health Check Verification
* **Evaluation**: `NOT RUN`
* **Liveness Probe Response (`GET /api/health/live`)**:
```text
[Paste JSON headers and response body]
```
* **Readiness Probe Response (`GET /api/health/ready`)**:
```text
[Paste JSON headers and response body under both success and mock-degraded conditions]
```

---

## 4. Risks & Defect Logging

### Known Defects
`[Record any failing test cases, unresolved validation bugs, or functional errors discovered during execution]`

### Accepted Risks
`[Record any accepted deviations from targets (e.g. non-functional latency targets not met due to provider downtime) and mitigation plans]`

---

## 5. Release Recommendation
* **Release Recommendation Status**: `NOT RUN`
* **Sign-Off Rationale**:
```text
[Provide final summary and recommendation details if all criteria evaluate to PASS]
```
