# 17 — Automation Catalog

- **Platform Name**: Conversa Automation Engine
- **Repository Root**: `c:\Users\rajaj\Projects\1_Conversa`
- **Last Synchronized**: 2026-07-23T05:10:00+05:30

---

## ⚡ Build, Evaluation & CI/CD Automations

### 1. npm Scripts (`package.json`)

* **`npm run dev`**: Launches Next.js 16 local development server with Turbopack enabled (`next dev --turbopack`).
* **`npm run build`**: Compiles production application bundle (`next build`).
* **`npm run typecheck`**: Runs zero-error static TypeScript validation (`tsc --noEmit`).
* **`npm run lint`**: Enforces ESLint quality rules with zero allowed warnings (`eslint . --max-warnings=0`).
* **`npm run test`**: Executes 49 unit and integration test suites using Vitest (`vitest run tests/unit`).
* **`npm run test:integration`**: Runs integration tests (`vitest run tests/integration`).
* **`npm run eval:agency`**: Executes agency crew extraction evaluation harness (`evaluation/run-eval.ts`).
* **`npm run eval:intelligence`**: Executes interaction intelligence evaluation harness (`evaluation/run-intel-eval.ts`).

---

### 2. Autonomous Workflows & AI Automations

* **Zero-Touch Ambient Join Bot**: Autonomous bot scheduler and recording capture workflow (`src/modules/media/ambient-join-bot.ts`).
* **Agent-to-Agent (A2A) Negotiation Engine**: Autonomous task allocation protocol (`src/modules/agency/a2a-negotiator.ts`).
* **Multi-Provider Failover Automation**: Automatic rate-limit and error recovery between primary and secondary LLM providers (`src/modules/analysis/failover-router.ts`).
* **3-Hash Cryptographic Manifest Generator**: Automated tamper-proof hashing pipeline (`semanticHash`, `contentHash`, `provenanceHash`).
