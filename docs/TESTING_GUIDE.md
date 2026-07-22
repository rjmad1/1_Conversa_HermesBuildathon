# Testing Guide

> **Current-state notice:** Conversa is an active MVP prototype. It contains incomplete, experimental, mocked, and security-remediation work. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

This document describes the test architecture and command execution references for Conversa.

## 1. Test Command Directory

| Test Suite | Command | Coverage Scope |
|:---|:---|:---|
| **Unit Tests** | `npm run test` | Validates validation schemas, logger redactions, and transcription contract interfaces. |
| **Integration Tests** | `npm run test:integration` | Validates multi-tenant boundaries, approvals, and the complete audio-to-action flow. |
| **End-to-End Tests** | `npm run test:e2e` | Validates the complete API endpoints and HTTP boundary responses. |
| **Adversarial Runner** | `npx vite-node security-audit-artifacts/remediation-verification/adversarial-runner.ts` | Audits access controls and verifies BOLA prevention. |

## 2. Test Architecture

The codebase splits testing into three levels to guarantee validation across domain layers:
1. **Unit Layer**: Mocks everything outside the specific file. Ensures schemas fail closed on invalid inputs.
2. **Integration Layer**: Combines modules, using `InMemory` repos to test full flow logic.
3. **E2E Layer**: Spins up the Hono app instance and checks JSON payloads over simulated HTTP client requests.
