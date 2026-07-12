# Residual Risks

This document outlines the remaining technical, operational, and architectural risks identified during acceptance verification.

## Identified Risks

1. **In-Memory Data Volatility (High Risk)**
   - **Description**: All agency runs, execution steps, and extracted findings are stored in transient RAM Map objects (`InMemoryAgencyRunRepo`).
   - **Impact**: Any server restart, Vercel container recycling, or code redeployment will wipe the entire database. Traces are not persistent.
   - **Mitigation**: Implement a persistent database layer (e.g. Postgres, MongoDB, or Convex) to store run traces and meeting analysis outputs.

2. **Lack of Automated CI Gate Enforcement (Medium Risk)**
   - **Description**: The evaluation script `run-eval.ts` runs successfully locally and exits non-zero on failure. However, there are no GitHub Actions workflows to automate this check.
   - **Impact**: Quality regressions can be pushed and merged into `main` without triggering warnings or blocking releases.
   - **Mitigation**: Create a GitHub Actions workflow `.github/workflows/eval.yml` that runs `npm run eval:agency` on every pull request.

3. **Production Authentication Bypass (Medium Risk)**
   - **Description**: The application runs under `DevIdentityAdapter` in all environments, including Vercel production.
   - **Impact**: No real user sign-in or authorization token check is done. Anyone can access or mutate another tenant's runs by spoofing header values.
   - **Mitigation**: Replace `DevIdentityAdapter` with a production authentication provider (e.g., Clerk, Auth0, or custom JWT adapter).

4. **Mock Cost and Latency Assumptions (Low Risk)**
   - **Description**: Real LLM integrations are disabled by default or run in mock mode. Cost is evaluated as `$0` and latency is `<1ms` in test runs.
   - **Impact**: Real-world network latency, API rate limits, and live LLM costs are not evaluated under load.
   - **Mitigation**: Conduct a controlled live test run with real OpenAI credentials to document live latency, cost, and rate-limiting limits.
