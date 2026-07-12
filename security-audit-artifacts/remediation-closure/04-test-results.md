# Regression Test Execution Results

This document records the commands, exit codes, and test outcomes executed to verify the security remediations.

## Environment Summary

* **Execution Runtime**: Node.js `v24.15.0`
* **Test Runner**: Vitest `v2.1.9`
* **Timestamp**: 2026-07-12T14:05:30Z

---

## Test Executions

### 1. TypeScript Compilation Check
* **Command**: `npm run typecheck`
* **Exit Code**: `0`
* **Result**: Clean build with zero TypeScript compiler errors.

### 2. E2E API Test Suite
* **Command**: `npm run test:e2e`
* **Exit Code**: `0`
* **Test Count**: 4 passed, 0 failed, 0 skipped
* **Files**: `tests/e2e/api.spec.ts`

### 3. Unit Test Suite
* **Command**: `npm run test`
* **Exit Code**: `0`
* **Test Count**: 10 passed, 0 failed, 0 skipped
* **Files**: `tests/unit/validation.spec.ts`

### 4. Integration Test Suite
* **Command**: `npm run test:integration`
* **Exit Code**: `0`
* **Test Count**: 19 passed, 0 failed, 0 skipped (Includes 7 new integration and boundary tests in `adversarial.spec.ts` and 12 flow tests in `flow.spec.ts`)
* **Files**: `tests/integration/flow.spec.ts`, `tests/integration/adversarial.spec.ts`

### 5. Production Build
* **Command**: `npm run build`
* **Exit Code**: `0`
* **Result**: Success. Vite output bundle generated in `/dist` cleanly.

### 6. Adversarial Runner
* **Command**: `npx vite-node security-audit-artifacts/remediation-verification/adversarial-runner.ts`
* **Exit Code**: `0`
* **Result**: Verified. Cross-boundary accesses return non-disclosing `HTTP 404` errors.
