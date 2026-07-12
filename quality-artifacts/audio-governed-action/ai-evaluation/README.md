# Meeting Analysis Evaluation Benchmark Pack

This benchmark pack provides an implementation-independent evaluation suite for verifying the transcript-to-meeting-analysis capabilities of the Conversa platform.

> [!IMPORTANT]
> **Evaluation Isolation Status**:
> 1. **No AI evaluation was executed** during the creation of this benchmark pack. No simulated model performance has been fabricated.
> 2. **No production source code, provider prompts, database schemas, or APIs were modified.** The application codebase remains completely untouched.

---

## 1. Objective and Scope
The goal of this benchmark is to measure whether an AI analysis provider correctly processes transcript inputs to generate meeting summaries, topics, decisions, and proposed action items. It evaluates extraction fidelity (such as owner mapping, date extraction, and risk levels) and enforces safety restrictions (such as prompt-injection blockages and secrets redaction).

### Excluded from Scope
To maintain evaluation isolation, the following aspects are explicitly out-of-scope:
- Speech-to-text transcription accuracy (this benchmark starts with validated text transcripts).
- Audio quality, formats, or ingestion pipeline performance.
- Downstream system integrations (e.g. actual ticket creation in Jira or CRM databases).
- Conversa user-interface rendering or web application behavior.

---

## 2. Artifact Inventory

This benchmark pack consists of the following documentation and configuration files:

* [00-Benchmark Design](file:///quality-artifacts/audio-governed-action/ai-evaluation/00-benchmark-design.md): Describes the core evaluation architecture, dimensions, and methodologies.
* [01-Evaluation Contract](file:///quality-artifacts/audio-governed-action/ai-evaluation/01-evaluation-contract.md): Defines the implementation-neutral JSON schema expected from a meeting analysis run.
* [02-Scoring Rubric](file:///quality-artifacts/audio-governed-action/ai-evaluation/02-scoring-rubric.md): Details the 100-point weighted scoring breakdown across 10 distinct evaluation dimensions.
* [03-Critical Failure Conditions](file:///quality-artifacts/audio-governed-action/ai-evaluation/03-critical-failures.md): Catalogues the 13 safety, hallucination, and structure failures that trigger an automatic run **FAIL**.
* [04-Golden Expectations](file:///quality-artifacts/audio-governed-action/ai-evaluation/04-golden-expectations.md): Outlines rules for extracting owners, deadlines, decisions, and evidence.
* [05-Failure Taxonomy](file:///quality-artifacts/audio-governed-action/ai-evaluation/05-failure-taxonomy.md): Systematically classifies 19 failure types, their severities, and developer remediation directions.
* [06-Repeatability Evaluation](file:///quality-artifacts/audio-governed-action/ai-evaluation/06-repeatability-evaluation.md): Defines multi-run testing protocols to verify output stability.
* [07-Release Gates](file:///quality-artifacts/audio-governed-action/ai-evaluation/07-release-gates.md): Specifies Candidate, Regression, and Production Readiness gate requirements.
* [08-Evaluation Run Template](file:///quality-artifacts/audio-governed-action/ai-evaluation/08-evaluation-run-template.md): Clean report template for logging execution scores and details.
* [Benchmark Manifest](file:///quality-artifacts/audio-governed-action/ai-evaluation/benchmark-manifest.json): Machine-readable catalog of all cases and their transcript sources.

---

## 3. Case Inventory

The benchmark catalogue contains **28 synthetic test cases**, mapped in the [cases/](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/) subdirectory:

### Baseline Test Cases (Cases 01–12)
These cases correspond to the pre-existing transcript fixtures:
- [EVAL-001: Clear Actions](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-001-clear-actions.json)
- [EVAL-002: Missing Owner & Date](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-002-missing-owner-and-date.json)
- [EVAL-003: No Actions](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-003-no-actions.json)
- [EVAL-004: Conflicting Decisions](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-004-conflicting-decisions.json)
- [EVAL-005: Multilingual Content](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-005-multilingual-content.json)
- [EVAL-006: Unicode Names](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-006-unicode-names.json)
- [EVAL-007: Prompt Injection](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-007-prompt-injection.json)
- [EVAL-008: Sensitive Information](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-008-sensitive-information.json)
- [EVAL-009: Long Transcript Boundary](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-009-long-transcript-boundary.json)
- [EVAL-010: Ambiguous Commitments](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-010-ambiguous-commitments.json)
- [EVAL-011: Duplicate Actions](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-011-duplicate-actions.json)
- [EVAL-012: High Risk Action](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-012-high-risk-action.json)

### New Edge-Case Fixtures (Cases 13–28)
These cases evaluate specific linguistic, security, and context resolution bounds (created under the [fixtures/](file:///quality-artifacts/audio-governed-action/ai-evaluation/fixtures/) subdirectory):
- [EVAL-013: Relative Dates](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-013-relative-dates.json) (Fixture: [13-relative-dates.txt](file:///quality-artifacts/audio-governed-action/ai-evaluation/fixtures/13-relative-dates.txt))
- [EVAL-014: Same Name Disambiguation](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-014-same-name-disambiguation.json) (Fixture: [14-multiple-people-same-name.txt](file:///quality-artifacts/audio-governed-action/ai-evaluation/fixtures/14-multiple-people-same-name.txt))
- [EVAL-015: No Owner](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-015-no-owner.json) (Fixture: [15-action-without-explicit-owner.txt](file:///quality-artifacts/audio-governed-action/ai-evaluation/fixtures/15-action-without-explicit-owner.txt))
- [EVAL-016: No Deadline](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-016-no-deadline.json) (Fixture: [16-action-without-explicit-deadline.txt](file:///quality-artifacts/audio-governed-action/ai-evaluation/fixtures/16-action-without-explicit-deadline.txt))
- [EVAL-017: Cancelled Action](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-017-cancelled-action.json) (Fixture: [17-cancelled-action.txt](file:///quality-artifacts/audio-governed-action/ai-evaluation/fixtures/17-cancelled-action.txt))
- [EVAL-018: Corrected Decision](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-018-corrected-decision.json) (Fixture: [18-corrected-decision.txt](file:///quality-artifacts/audio-governed-action/ai-evaluation/fixtures/18-corrected-decision.txt))
- [EVAL-019: Negated Commitment](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-019-negated-commitment.json) (Fixture: [19-negated-commitment.txt](file:///quality-artifacts/audio-governed-action/ai-evaluation/fixtures/19-negated-commitment.txt))
- [EVAL-020: Hypothetical Discussion](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-020-hypothetical-discussion.json) (Fixture: [20-hypothetical-discussion.txt](file:///quality-artifacts/audio-governed-action/ai-evaluation/fixtures/20-hypothetical-discussion.txt))
- [EVAL-021: External Prompt Injection](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-021-external-instruction-injection.json) (Fixture: [21-external-instruction-injection.txt](file:///quality-artifacts/audio-governed-action/ai-evaluation/fixtures/21-external-instruction-injection.txt))
- [EVAL-022: Data Minimization](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-022-data-minimization.json) (Fixture: [22-confidential-data-minimization.txt](file:///quality-artifacts/audio-governed-action/ai-evaluation/fixtures/22-confidential-data-minimization.txt))
- [EVAL-023: Contradictory Dates](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-023-contradictory-dates.json) (Fixture: [23-contradictory-due-dates.txt](file:///quality-artifacts/audio-governed-action/ai-evaluation/fixtures/23-contradictory-due-dates.txt))
- [EVAL-024: Large Action List](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-024-large-action-list.json) (Fixture: [24-large-action-list.txt](file:///quality-artifacts/audio-governed-action/ai-evaluation/fixtures/24-large-action-list.txt))
- [EVAL-025: Conversational Noise](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-025-conversational-noise.json) (Fixture: [25-noisy-conversational-language.txt](file:///quality-artifacts/audio-governed-action/ai-evaluation/fixtures/25-noisy-conversational-language.txt))
- [EVAL-026: Implicit Priority](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-026-implicit-priority.json) (Fixture: [26-implicit-priority.txt](file:///quality-artifacts/audio-governed-action/ai-evaluation/fixtures/26-implicit-priority.txt))
- [EVAL-027: Unsafe Destructive Request](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-027-unsafe-destructive-request.json) (Fixture: [27-unsafe-destructive-request.txt](file:///quality-artifacts/audio-governed-action/ai-evaluation/fixtures/27-unsafe-destructive-request.txt))
- [EVAL-028: Cross-Meeting Reference](file:///quality-artifacts/audio-governed-action/ai-evaluation/cases/EVAL-028-cross-meeting-reference.json) (Fixture: [28-cross-meeting-reference.txt](file:///quality-artifacts/audio-governed-action/ai-evaluation/fixtures/28-cross-meeting-reference.txt))

---

## 4. Run Execution Protocol

For future QA teams conducting evaluations:

1. **Map Production Schemas**: Map the Conversa JSON output structure returned by the active model provider to the canonical structure specified in `01-evaluation-contract.md`.
2. **Execute Multi-Run Sets**: Run all 28 cases 5 consecutive times (temperature = `0.0`, fixed random seed).
3. **Parse and Score**: Execute automated script checks to verify structural validity and evidence presence. Assess semantic accuracy against each case's expected results.
4. **Identify Critical Failures**: Scan output files against the criteria in `03-critical-failures.md`. Any critical failure results in an immediate **FAIL** for the model version.
5. **Compile Run Report**: Copy `08-evaluation-run-template.md` to a new document (e.g. `runs/RUN-20231016.md`), fill in the metadata, individual case scores, and final release gate recommendation.

---

## 5. Merging and Branch Policy
- This package is developed on the isolated branch `HERMES_FOURTHGATE/ai-evaluation-benchmark`.
- All modifications are isolated to the `quality-artifacts/audio-governed-action/ai-evaluation/` directory.
- This directory is completely self-contained and cherry-pickable into main or staging release branches without introducing dependencies or impacting execution runtimes.
