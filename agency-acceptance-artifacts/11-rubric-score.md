# Rubric Score Recalculation

This document recalculates the official AI-as-Agency rubric score for Conversa after verifying the newly implemented features.

## Score Comparison Table

| Parameter | Weight | Previous Level | Previous Score | New Level | New Score | Delta | Evidence / Rationale |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Working Product** | 20x | L3 | 60 | **L3** | **60** | +0 | Fully functional managed agency flow. Rated L3 due to ephemeral in-memory storage (RAM only). |
| **Agent Organization** | 5x | L2 | 10 | **L4** | **20** | +10 | verified dynamic planning, specialist skipping, QA rejection, revision retry, and escalation behavior. |
| **Observability** | 7x | L1 | 7 | **L4** | **28** | +21 | Trace UI rendering steps, latency, token counts, estimated cost, revision counts, filters, and side-by-side comparisons. |
| **Evaluation and Iteration** | 5x | L3 | 15 | **L3** | **15** | +0 | Verification gate exists and blocks locally on quality regression, but lacks CI release-blocking automation. |
| **Handoffs and Memory** | 2x | L3 | 6 | **L3** | **6** | +0 | Explicit handoff context envelopes used throughout runs. Rated L3 because memory is in-memory only and reset on restart. |
| **Cost and Latency** | 1x | L4 | 4 | **L4** | **4** | +0 | Precise token tracking and cost reporting in traces. Average latency sub-millisecond on mock runs. |
| **Management UI** | 1x | L3 | 3 | **L4** | **4** | +1 | Non-engineer can adjust specialists, change threshold slider, view sequence, approve runs, and compare histories. |
| **Total Score** | | | **105 / 164** | | **137 / 164** | **+32** | **Significant improvement in agency capabilities and system audit controls.** |
