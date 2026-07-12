# Benchmark Design: Meeting Analysis Evaluation

This document defines the architectural and methodological design of the evaluation benchmark for the transcript-to-meeting-analysis capability of the Conversa platform.

## Benchmark Objective
The primary objective of this benchmark is to evaluate the quality, precision, completeness, safety, and stability of the AI transcript-analysis engine. It ensures that the generated structured analysis faithfully represents the actual meeting proceedings and does not introduce fabricated information, duplicate actions, or security hazards.

## Capabilities Being Evaluated
The benchmark evaluates whether the analysis engine correctly extracts:
1. **Meeting Summary**: A concise, coherent summary of the main discussion.
2. **Topics**: Major areas of discussion covered during the meeting.
3. **Decisions**: Final agreed-upon decisions, including their rationale, supporting transcript source evidence, and extraction confidence.
4. **Proposed Actions**: Structured task commitments including:
   - Action description
   - Owner name (must remain `null` if unsupported/ambiguous)
   - Owner reference
   - Due date (must remain `null` if unsupported/ambiguous)
   - Priority classification (`HIGH`, `MEDIUM`, `LOW`)
   - Target system for execution
   - Action type
   - Rationale
   - Supporting evidence from the transcript
   - Confidence score
   - Risk level (`HIGH`, `MEDIUM`, `LOW`)
5. **Risks**: Potential issues or blockers identified during the meeting.

## Capabilities Excluded
To ensure isolation and independence, the following capabilities are **explicitly excluded** from this benchmark:
- **Speech-to-Text (STT) Accuracy**: The benchmark begins with validated text transcripts. It does not measure audio transcription word error rate (WER) or speaker identification from audio.
- **Audio Quality Evaluation**: Noise level, clipping, compression, sample rates, and formats are out of scope.
- **Live-Streaming Performance**: Real-time streaming and transcription latency are out of scope.
- **Downstream Tool Execution**: Triggering external actions, database writes, or task creations is not evaluated.
- **Jira or CRM Integration Behavior**: We do not verify if tasks are successfully exported to third-party APIs.
- **User-Interface (UI) Behavior**: Front-end rendering, state transitions, and keyboard accessibility are out of scope.

## Input Sources
The benchmark utilizes 28 synthetic transcript fixtures:
- `01` through `12` are existing test transcripts (representing baseline functional, security, and edge-case behaviors).
- `13` through `28` are newly introduced synthetic transcripts (representing linguistic noise, disambiguation challenges, and specific safety hazards).

## Evaluation Dimensions
The benchmark scores analysis outputs across ten distinct dimensions:
1. Structural validity (JSON syntax, correct schema)
2. Summary faithfulness (accuracy and lack of hallucinations in the summary)
3. Topic coverage (correct identification of high-level discussion points)
4. Decision precision and recall (capturing true decisions, excluding rejected ones)
5. Action precision and recall (capturing true commitments, excluding non-committal or cancelled ones)
6. Evidence grounding (direct link to transcript source sentences)
7. Owner and due-date fidelity (correctly extracting names and deadlines, maintaining `null` when unspecified)
8. Risk and priority classification (accurate categorization of hazard and importance levels)
9. Safety and prompt-injection resistance (ignoring override attempts and preventing execution of dangerous actions)
10. Duplication and consistency (preventing duplicate action items and resolving contradictory outputs)

## Scoring Philosophy
The scoring model uses a 100-point weighted scale combined with a **Critical Failure Override**. Even if an LLM achieves a high numerical score, any occurrence of a Critical Failure (such as fabricated dates, hallucinated owners, or prompt-injection compliance) automatically reduces the evaluation result to a **FAIL**. 

The benchmark emphasizes semantic equivalence over exact keyword matching.

## Deterministic vs. Semantic Checks
- **Deterministic Checks**: Applied to structural properties (JSON structure, non-null values for specific fields, correct enum ranges like `HIGH`/`MEDIUM`/`LOW`).
- **Semantic Checks**: Applied to summaries, decisions, and action descriptions. We look for core semantic markers, required evidence phrases, and the absence of prohibited topics or hallucinations.

## Limitations
- **Linguistic Variability**: LLM outputs can vary slightly while remaining semantically correct.
- **Context Dependency**: Resolving relative dates (e.g. "by next Friday") requires injecting the specific meeting date, which must be provided in the test context.
- **No Real-Time Interaction**: This is a batch-mode static evaluation and does not capture conversational state dynamics.

## Assumptions
- Transcripts are structured as speaker-turn dialogue or clean prose.
- The evaluation contract will be mapped from the production schema when executing the benchmark on a real model.

## Risks of Overfitting
There is a risk that developers will optimize system prompts specifically to pass these 28 cases (e.g. by hardcoding rules for names like Priya and Rajeev). To mitigate this:
1. Ensure the rubric focuses on generalizable rules rather than literal string matches.
2. Regularly rotate or introduce new synthetic test fixtures in the suite.
3. Combine automated keyword/semantic matching with human safety review gates.
