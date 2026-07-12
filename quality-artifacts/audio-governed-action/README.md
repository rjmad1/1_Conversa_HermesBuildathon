# Conversa Quality and Verification Pack

This directory contains the independent Enterprise QA, Security, and Release Assurance readiness pack for the Conversa Audio-to-Governed-Action milestone.

> [!IMPORTANT]
> **Isolation and Non-Interference Declaration:**
> No production code files, database schemas, configurations, route handlers, package manifests, or deployment settings have been added, modified, reformatted, or deleted in the workspace. All quality pack deliverables are isolated strictly within this `quality-artifacts/audio-governed-action/` directory on the `HERMES_SECONDGATE/qa-readiness-pack` branch.

---

## Artifact Inventory

| Quality Artifact | File Link | Purpose & Hermes Handoff Usage |
|---|---|---|
| **00. Repository Observations** | [00-repository-observations.md](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/00-repository-observations.md) | Lists observed stack facts, inferred expectations, and design gaps (e.g. action tenant scope gap). |
| **01. Requirements Traceability** | [01-requirements-traceability.md](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/01-requirements-traceability.md) | Maps all milestone requirements (Functional, Security, Isolation) to unique IDs with verification statuses set to `NOT_VERIFIED`. |
| **02. Acceptance Scenarios** | [02-acceptance-scenarios.md](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/02-acceptance-scenarios.md) | Defines implementation-neutral Given/When/Then scenarios for unit, integration, and E2E validation. |
| **03. Security & Privacy Review** | [03-security-privacy-review.md](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/03-security-privacy-review.md) | Outlines threats and security review criteria covering tenant isolation, path traversal, and prompt injection. |
| **04. API Contract Review** | [04-api-contract-review.md](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/04-api-contract-review.md) | Details expected routes, error envelopes, and request validations for the 12 endpoints. |
| **05. Non-Functional Quality Gates** | [05-nonfunctional-quality-gates.md](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/05-nonfunctional-quality-gates.md) | Quantitative gates for code quality, latency, size limits, and reliability. |
| **06. Release Evidence Template** | [06-release-evidence-template.md](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/06-release-evidence-template.md) | Empty reporting template for documenting actual test results using standard evaluations (`PASS`, `FAIL`, etc.). |
| **07. Hermes Completion Review** | [07-hermes-completion-review.md](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/07-hermes-completion-review.md) | Auditing checklist to check the parallel implementing agent (Hermes) against common gaps. |
| **08. Expected Results** | [expected-results.md](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/fixtures/expected-results.md) | Precise validation rules for LLM summaries, decisions, and risk behaviors. |
| **09. Audio Fixture Manifest** | [audio-fixture-manifest.md](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/fixtures/audio-fixture-manifest.md) | Details specifications for binary audio files to generate for unit and integration testing. |

### Synthetic Transcript Fixtures
All synthetic transcripts are fully anonymous, non-sensitive, and isolate specific parser edge-cases. They are located under [transcripts](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/fixtures/transcripts/):
* [01-clear-actions.txt](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/fixtures/transcripts/01-clear-actions.txt) — Verifies parsing of clear actions, owners, and dates.
* [02-missing-owners-and-dates.txt](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/fixtures/transcripts/02-missing-owners-and-dates.txt) — Verifies that unassigned items remain `null`.
* [03-no-actions.txt](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/fixtures/transcripts/03-no-actions.txt) — Verifies that conversational chat generates empty arrays.
* [04-conflicting-decisions.txt](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/fixtures/transcripts/04-conflicting-decisions.txt) — Verifies that revised dates update correctly.
* [05-multilingual-content.txt](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/fixtures/transcripts/05-multilingual-content.txt) — Verifies multilingual support.
* [06-unicode-names.txt](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/fixtures/transcripts/06-unicode-names.txt) — Verifies that diacritic characters in names are preserved.
* [07-prompt-injection-attempt.txt](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/fixtures/transcripts/07-prompt-injection-attempt.txt) — Verifies system resilience against LLM override payloads.
* [08-sensitive-data-redaction.txt](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/fixtures/transcripts/08-sensitive-data-redaction.txt) — Verifies key and credit card data exclusion.
* [09-long-transcript-boundary.txt](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/fixtures/transcripts/09-long-transcript-boundary.txt) — Tests long multipart kickoff transcripts.
* [10-ambiguous-commitments.txt](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/fixtures/transcripts/10-ambiguous-commitments.txt) — Tests that casual banter does not generate fake tasks.
* [11-duplicate-actions.txt](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/fixtures/transcripts/11-duplicate-actions.txt) — Verifies duplicate actions are collapsed.
* [12-high-risk-action.txt](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/fixtures/transcripts/12-high-risk-action.txt) — Verifies correct indexing of high risk database changes.

---

## Utilization & Test Conversion Strategy

1. **Creating Automated Tests**:
   - The Given/When/Then statements in [02-acceptance-scenarios.md](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/02-acceptance-scenarios.md) translate directly to Vitest E2E API tests (e.g., using `supertest` or Hono `app.request()`).
   - The 12 transcript text files can be loaded in Vitest integration tests to verify the `AnalyzeMeetingTranscript` execution output matches the constraints in [expected-results.md](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/fixtures/expected-results.md).
   - Use the [audio-fixture-manifest.md](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/fixtures/audio-fixture-manifest.md) criteria to generate binary audio testing assets with `ffmpeg` or TTS, validating the boundary gates of the media upload controller.

2. **H Hermes Workflow**:
   - The implementing agent (Hermes) must review the API endpoints in [04-api-contract-review.md](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/04-api-contract-review.md) to ensure correct routing parameters and validation schemas.
   - Hermes must fill out the [06-release-evidence-template.md](file:///c:/Users/rajaj/Projects/1_Conversa/quality-artifacts/audio-governed-action/06-release-evidence-template.md) file when completion is ready.

---

## Known Assumptions & Limitations

* **OpenAI API Key**: It is assumed that the test environment does not execute real OpenAI network requests, defaulting strictly to the offline fake transcription and analysis providers.
* **Metadata Tenant Leakage**: The database domain models for `ProposedAction` do not contain a direct `tenantId` field. Enforcing tenant scoping relies on loading the parent `Meeting` record.
