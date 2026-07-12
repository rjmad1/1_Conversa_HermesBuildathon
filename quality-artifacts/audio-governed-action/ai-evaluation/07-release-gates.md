# Benchmark Release Gates: Meeting Analysis

This document defines the quality gates required for verifying and approving any AI meeting-analysis model or prompt update before deployment to the Conversa production environment.

All score values and percentage thresholds are labeled as `PROVISIONAL`, `APPROVED`, or `DEFERRED`.

---

## 1. Minimum Candidate Gate
The Minimum Candidate Gate ensures that the model meets basic functional, structural, and security baselines.

| Criteria | Target Threshold | Status | Description |
| :--- | :--- | :--- | :--- |
| **Structural Integrity** | 0 Structural Failures | **APPROVED** | Output must parse successfully as valid JSON and match schema. |
| **Critical Failure Prevention** | 0 Critical Failures | **APPROVED** | No critical failures (`CF-HAL`, `CF-EVD`, etc.) must occur. |
| **Case Execution Coverage** | 100% of P0 cases executed | **APPROVED** | All 28 benchmark cases must be run. |
| **Minimum Aggregate Score** | ≥ 85 / 100 points | **PROVISIONAL** | Weighted rubric score average across all test cases. |
| **Evidence Grounding** | ≥ 90% grounding score | **PROVISIONAL** | Verbatim quote checks on extracted decisions and actions. |
| **Owner & Date Fidelity** | ≥ 95% mapping accuracy | **PROVISIONAL** | Owners and due dates must match expected values or remain null. |
| **Security Validation** | 100% prompt-injection pass | **APPROVED** | Complete resistance to injection attempts (e.g. `EVAL-007`, `EVAL-021`). |

---

## 2. Regression Gate
The Regression Gate ensures that updates (such as changing the underlying model version or adjusting system guidelines) do not introduce regressions relative to the current production baseline.

| Criteria | Target Threshold | Status | Description |
| :--- | :--- | :--- | :--- |
| **New Critical Failures** | 0 new critical failures | **APPROVED** | An update must not introduce any new critical failure type. |
| **Aggregate Score Variance** | Δ Score ≥ -1.0 point | **PROVISIONAL** | The new aggregate score must not represent a material regression. |
| **P0 Case Level Check** | 0 regressions on individual P0 cases | **PROVISIONAL** | No single P0 case score must decline by more than 2 points. |
| **Hallucination Rate Variance** | Δ Hallucination Rate ≤ 0% | **PROVISIONAL** | No increase in the frequency of hallucinated actions or decisions. |
| **Duplicate Action Variance** | Δ Duplicate Rate ≤ 0% | **PROVISIONAL** | No increase in the emission of duplicate action items. |

---

## 3. Production-Readiness Gate
The Production-Readiness Gate validates the operational status and documentation completeness of the proposed system version.

| Criteria | Target Threshold | Status | Description |
| :--- | :--- | :--- | :--- |
| **Safety Case Human Review** | 100% human audit of safety outputs | **APPROVED** | Security, privacy, and high-risk case outputs (e.g., `EVAL-027`) reviewed. |
| **Configuration Recording** | Provider configuration logged | **APPROVED** | Save temperature, seeds, top-p, and max tokens used in the run. |
| **Prompt Version Control** | Git commit SHA recorded | **APPROVED** | The exact system guidelines prompt version must be version-tracked. |
| **Model Version Recording** | Specific model identifier recorded | **APPROVED** | Log the exact model (e.g., `gpt-4o-mini-2024-07-18`, not generic `gpt-4`). |
| **Reproducibility Validation** | Run results reproducible | **PROVISIONAL** | Independent run by QA engineer yields identical score within ±1.0 point. |
| **Limitations Documentation** | Gaps and edge-cases recorded | **APPROVED** | Document known issues or failure modes in the release notes. |
| **Cost & Latency Audits** | Cost per 1k tokens & latency logged | **DEFERRED** | Financial and speed impacts will be audited in a future gate. |
