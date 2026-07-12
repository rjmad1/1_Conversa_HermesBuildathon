# Evaluation Run Report: [RUN-ID]

This report documents the results of executing the Meeting Analysis Evaluation Benchmark. 

---

## 1. Run Metadata
* **Evaluation Run ID**: *[e.g., RUN-20231016-01]*
* **Execution Date**: *[YYYY-MM-DD]*
* **Evaluator Name**: *[Name / ID]*
* **Source Code Commit SHA**: *[Git hash]*
* **Prompt Version**: *[Commit SHA or tag of system instructions]*
* **AI Provider**: *[e.g., OpenAI, Anthropic, Local]*
* **Model Name & Version**: *[e.g., gpt-4o-mini-2024-07-18]*
* **Model Configuration**:
  - Temperature: *[e.g., 0.0]*
  - Max Tokens: *[e.g., 1000]*
  - Seed: *[e.g., 42]*
  - Other: *[e.g., JSON Mode enabled]*
* **Execution Environment**: *[e.g., Local dev, Staging, CI/CD runner]*

---

## 2. Case Inventory & Execution Status
* **Total Cases in Benchmark**: 28
* **Cases Executed**: *[Count]*
* **Cases Blocked**: *[Count / List]*

---

## 3. Results Summary
* **Aggregate Weighted Score**: *[Score / 100]*
* **Critical Failures Detected**: *[Yes/No - List IDs if Yes]*
* **Regressions Detected**: *[Yes/No - List compared Run ID]*
* **Multi-Run Stability Status**: *[Stable / Unstable]*

---

## 4. Per-Case Score Breakdown

| Case ID | Case Title | Priority | Executed? | Score | Critical Failures Triggered | Notes |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **EVAL-001** | Clear Actions | P0 | | | | |
| **EVAL-002** | Missing Owner & Date | P0 | | | | |
| **EVAL-003** | No Actions | P0 | | | | |
| **EVAL-004** | Conflicting Decisions | P0 | | | | |
| **EVAL-005** | Multilingual Content | P0 | | | | |
| **EVAL-006** | Unicode Names | P0 | | | | |
| **EVAL-007** | Prompt Injection | P0 | | | | |
| **EVAL-008** | Sensitive Information | P0 | | | | |
| **EVAL-009** | Long Transcript | P0 | | | | |
| **EVAL-010** | Ambiguous Commitments | P0 | | | | |
| **EVAL-011** | Duplicate Actions | P0 | | | | |
| **EVAL-012** | High Risk Action | P0 | | | | |
| **EVAL-013** | Relative Dates | P0 | | | | |
| **EVAL-014** | Same Name Disambiguation | P0 | | | | |
| **EVAL-015** | No Owner | P0 | | | | |
| **EVAL-016** | No Deadline | P0 | | | | |
| **EVAL-017** | Cancelled Action | P0 | | | | |
| **EVAL-018** | Corrected Decision | P0 | | | | |
| **EVAL-019** | Negated Commitment | P0 | | | | |
| **EVAL-020** | Hypothetical Discussion | P0 | | | | |
| **EVAL-021** | External Prompt Injection | P0 | | | | |
| **EVAL-022** | Data Minimization | P0 | | | | |
| **EVAL-023** | Contradictory Dates | P0 | | | | |
| **EVAL-024** | Large Action List | P0 | | | | |
| **EVAL-025** | Conversational Noise | P0 | | | | |
| **EVAL-026** | Implicit Priority | P0 | | | | |
| **EVAL-027** | Unsafe Destructive Request | P0 | | | | |
| **EVAL-028** | Cross-Meeting Reference | P0 | | | | |

---

## 5. Critical Failure & Regression Detail
* **Critical Failures Encountered**:
  - *[Case ID & Failure ID, e.g., EVAL-002: CF-HAL-001 (Priya assigned to unassigned task). Description of event]*
* **Regressions Encountered**:
  - *[Comparison against baseline run, e.g. Score on EVAL-009 dropped from 95 to 80 due to action omission]*

---

## 6. Stability Check Details (Multi-Run Verification)
* **Number of Repetitions Run**: *[e.g., 5]*
* **Variance Observed**:
  - *[e.g., EVAL-025 had action count variance of 1 (Run 3 missed the action).]*
* **Stable Fields Check**: *[List any fields that showed instability]*

---

## 7. Evidence & Logs
* **Raw LLM JSON Outputs Directory**: *[Provide repository path or link]*
* **Detailed Execution Logs**: *[Provide path or link]*

---

## 8. Run Limitations & Observations
* *[Document any factors that impacted the validity of this run, e.g., API rate-limits, connection drops, context truncation]*

---

## 9. Final Evaluation Recommendation
Select one recommendation:
* `PASS` (All gates passed, no critical failures, score above threshold)
* `PASS_WITH_CONDITIONS` (Minor edge-cases failed, but within acceptable parameters; specify conditions)
* `FAIL` (One or more critical failures occurred, or score below minimum threshold)
* `BLOCKED` (Execution incomplete, API outages, or validation blocked)

**Recommendation Rationale & Conditions**:
*[Provide detailed notes supporting the selection]*
