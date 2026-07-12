# Repeatability and Stability Evaluation Guide

This document defines the methodology for evaluating the repeatability and stability of Conversa meeting analysis engine outputs. Due to the probabilistic nature of LLMs, stability testing is crucial to ensure consistent output quality.

---

## 1. Repeatability Execution Protocol

### Recommended Number of Repetitions
For each benchmark test case, future evaluators must execute the model **five (5) consecutive times** (using identical prompts, configurations, and temperatures) to establish a repeatability baseline. For final release validation, **ten (10) repetitions** are recommended.

### Environment & Temperature Configuration
- **Deterministic Providers** (e.g. self-hosted Whisper or local LLMs): Set temperature to `0.0` (or `0.0001`) and fix the seed configuration if supported by the engine.
- **Production Providers** (e.g. OpenAI GPT-4o-mini): Set temperature to `0.0`, specify a static random seed, and verify that the provider uses deterministic routing when available.

---

## 2. Field-Level Stability Expectations

The system categorizes evaluation output fields into two groups: those requiring absolute stability, and those allowing semantic variation.

### Fields Requiring Exact Stability
- **`proposedActions[].ownerName`**: Must be identical across all runs (e.g., if Run 1 assigns a task to `Priya`, Runs 2-5 must assign it to `Priya`; if Run 1 is `null`, all others must be `null`).
- **`proposedActions[].dueDate`**: Must be identical in string value or nullability across all runs.
- **`proposedActions[].priority`**: Must remain consistent (e.g., always `HIGH`, never shifting between `HIGH` and `MEDIUM` across runs).
- **`proposedActions[].riskLevel`**: Must remain consistent.
- **`proposedActions[].targetSystem`**: Must be identical.
- **`topics`**: The list of extracted topics must be identical in content (order-insensitive).

### Fields Allowing Semantic Variation
- **`summary`**: Phrasing, sentence structure, and word choices may vary, provided the core facts remain identical.
- **`proposedActions[].description`**: Wording can vary semantically (e.g., "Draft the RFC" vs "Write integration RFC draft") as long as they represent the same task.
- **`decisions[].description`**: Minor phrasing variations are acceptable.
- **`decisions[].rationale`**: Explanation structure may vary slightly.
- **`proposedActions[].sourceEvidence` / `decisions[].sourceEvidence`**: Verbatim quotes may have slightly different boundary sentence boundaries (e.g. Run 1 includes Priya's name in the quote, Run 2 starts after the colon), but must refer to the same source speaker turn.

---

## 3. Variance & Instability Thresholds

All numerical thresholds listed below are **PROVISIONAL** and subject to adjustments as model baselines stabilize.

### Acceptable Action-Count Variance
- **Provisional Threshold**: Variance must be **zero (0)**. 
- If a transcript has 3 clear actions, all 5 runs must return exactly 3 actions. A variation in count across runs (e.g., Run 1 returns 3 actions, Run 2 returns 4 actions) represents a stability failure.

### Acceptable Decision-Count Variance
- **Provisional Threshold**: Variance must be **zero (0)**.
- The number of decisions must be identical across all runs.

### Semantic Equivalence Guidance (Deduplication)
To evaluate whether two descriptions across runs are semantically equivalent:
1. Apply Jaccard similarity to the lowercase tokens (excluding stop words). A score **> 0.75** indicates semantic equivalence.
2. Apply a semantic embedding cosine similarity check (e.g. using a lightweight transformer). A similarity **> 0.85** indicates equivalence.

### Instability Thresholds (Run-level Failure)
A case is flagged as **UNSTABLE** if:
- Any exact-stability field varies in more than **1 out of 5 runs** (e.g., ownerName changes, or priority changes).
- The action-count variance is greater than **0**.
- The decision-count variance is greater than **0**.

If the engine is flagged as UNSTABLE on any P0 case, the release is **BLOCKED** until the provider configuration or temperature is tuned for determinism.
