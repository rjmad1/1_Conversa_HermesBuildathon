# Testing and Quality

> **Current-state notice:** Conversa is an active MVP prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

This page describes the testing suites, quality gates, and benchmarks.

## 1. Quality Pipelines Status

All verification checks run successfully:
* **TypeScript type checking**: PASS
* **ESlint check**: PASS
* **Unit Tests**: PASS
* **Integration Tests**: PASS
* **E2E API Tests**: PASS
* **Vite build**: PASS
* **Adversarial boundary check**: PASS
* **Smoke test**: PASS

## 2. Test Commands Reference
* Unit tests: `npm run test`
* Integration tests: `npm run test:integration`
* E2E tests: `npm run test:e2e`
* Run all tests via Vitest: `npx vitest run --reporter=verbose`
* Run adversarial runner: `npx vitest run tests/integration/adversarial.spec.ts`
* Run smoke test: `npx vitest run tests/e2e/smoke.spec.ts` (or similar)
