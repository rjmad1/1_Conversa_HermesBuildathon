# CI Evaluation Gate

This document records the verification of the automated evaluation gate and its deployment-blocking characteristics.

## Gate Failure Test Results

- **Gate command**: `npm run eval:agency`
- **Baseline (Passing) exit code**: `0`
- **Failing Experiment (Decision Recall threshold raised to 105%) exit code**: `1`
- **Threshold breached**: Decision Recall (Result: `100.0%`, Threshold: `105.0%`)
- **CI Workflow Path**: None (No `.github/workflows` folder exists in the repository).
- **CI Release-Blocking Behavior**: Local-only pre-push/pre-commit gate. There is no automated remote CI pipeline executing this check.

---

## Evaluation Gate Maturity

> [!IMPORTANT]
> **Maturity Level**: **Local-only (L3/L4 boundary)**
>
> The evaluation gate runs perfectly and returns a non-zero exit code when quality drops below required thresholds. However, because there are no active CI workflows in the codebase, the gate is currently restricted to local development environments.
