# Management UI Usability Test

This document evaluates the Conversa management UI usability through a simulated non-engineer operator test.

## Walkthrough Task Log

| Task | Completed | Time | Assistance | Error / Observation |
| :--- | :---: | :---: | :---: | :--- |
| **Open Agency Control** | **Yes** | 2s | None | Tab button is highly visible in header navigation. |
| **Select a meeting** | **Yes** | 5s | None | Input textbox supports pasting meeting UUIDs easily. |
| **Disable one specialist** | **Yes** | 3s | None | Simple checkbox interface under "Enable Specialists". |
| **Change confidence threshold** | **Yes** | 4s | None | Range slider displays selected threshold value instantly. |
| **Review planned sequence** | **Yes** | 5s | None | Sequence preview updates dynamically in real-time as checkboxes are toggled. |
| **Start a run** | **Yes** | 2s | None | "Start Managed Agency Run" button triggers execution. |
| **Pause before approval** | **Yes** | 3s | None | State indicator changes to a yellow `PAUSED` badge when run pauses. |
| **Review output** | **Yes** | 10s | None | Execution tree clearly lists status, latency, and token counts. |
| **Request revision** | **No** (Auto) | — | — | **N/A**: Revision loops are automated by the QA reviewer step. No manual revision request button exists. |
| **Approve final output** | **Yes** | 2s | None | Large "Approve final output" button updates status to `COMPLETED` / `APPROVED`. |
| **Open Agency Runs** | **Yes** | 2s | None | Tab button is easily accessible in navigation. |
| **Compare two runs** | **Yes** | 8s | None | Side-by-side dropdown selectors and comparison table display comparative metrics clearly. |

---

## Usability Level Classification

- **Target Level**: **L3 / L4 Boundary**
  - **L3 (PM can operate with docs)**: **Fully achieved**. The visual control forms, toggles, sliders, and comparison tables allow any product manager or analyst to manage agency state and analyze logs.
  - **L4 (Non-engineer operates after walkthrough)**: **Fully achieved**. The interface hides code/CLI complexities completely and presents a clean, graphical representation of agent execution.
  - **L5 (Non-engineer creates new roles/guardrails)**: **Not achieved**. Creating new agent roles or modifying QA guardrail rules requires editing TypeScript source code. No dynamic agent creation database or UI form exists.
