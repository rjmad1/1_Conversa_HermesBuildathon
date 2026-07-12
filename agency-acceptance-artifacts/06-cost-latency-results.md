# Cost and Latency Results

This document records performance metrics captured across five representative meeting agency tasks.

## Performance Metrics Table

| Run | Provider | Input Tokens | Output Tokens | Estimated Cost (Fake) | Estimated Cost (GPT-4o) | Estimated Cost (GPT-4o-mini) | Total Latency | Success |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Case 1 (Basic)** | fake | 421 | 360 | $0.0000 | $0.007505 | $0.000279 | 1.44 ms | Yes |
| **Case 2 (Ambiguous)** | fake | 232 | 230 | $0.0000 | $0.004610 | $0.000173 | 0.20 ms | Yes |
| **Case 3 (Missing Date)** | fake | 258 | 270 | $0.0000 | $0.005340 | $0.000201 | 0.21 ms | Yes |
| **Case 4 (No Risks)** | fake | 253 | 270 | $0.0000 | $0.005315 | $0.000200 | 0.39 ms | Yes |
| **Case 5 (Complex)** | fake | 525 | 420 | $0.0000 | $0.008925 | $0.000331 | 0.26 ms | Yes |

---

## Statistical Analysis

- **Average Latency**: `0.50 ms`
- **P50 Latency**: `0.26 ms`
- **P95 Latency**: `1.44 ms`
- **Average Cost (Fake Provider)**: `$0.000000`
- **Average Cost (GPT-4o Live Estimate)**: `$0.006339`
- **Average Cost (GPT-4o-mini Live Estimate)**: `$0.000237`
- **Highest-Cost Agent**: `ACTION_SPECIALIST` (Extracts complex actions structure with detailed metadata fields, consuming the most output tokens: `proposedActions.length * 60 + 10`).
- **Highest-Latency Agent**: `ACTION_SPECIALIST` (Requires most CPU execution cycles for data mapping and optional revision adjustments).
- **Revision Overhead**: A revision loop forces a full re-execution of the specialist and QA reviewer. For `ACTION_SPECIALIST` (e.g. Case 17), this adds ~100% token usage and latency overhead to that specific step.
- **Fake-provider vs. Live-provider**:
  - **Fake Provider**: Fixed `$0.0000` cost. Completely deterministic, sub-millisecond execution.
  - **Live OpenAI GPT-4o**: Significant cost (~$0.0063 per run) and higher estimated live network latency (typically 1.5s - 3s per call).
  - **Live OpenAI GPT-4o-mini**: Low cost (~$0.0002 per run) and lower network latency (~500ms - 1s).
