# Canonical Evaluation Output Contract: Meeting Analysis

This document defines the canonical output structure for evaluating meeting analysis models and provider adapters in the Conversa platform. 

> [!IMPORTANT]
> This is a logical, implementation-neutral **evaluation schema** and is NOT a replacement for the active production schemas. Real production outputs must be mapped to this contract before benchmark scoring can be calculated.

## Canonical Schema Structure

All evaluation candidate analysis outputs must be mapped to the following JSON structure:

```json
{
  "summary": "String",
  "topics": [
    "String"
  ],
  "decisions": [
    {
      "description": "String",
      "rationale": "String",
      "sourceEvidence": [
        "String"
      ],
      "confidence": 0.0
    }
  ],
  "proposedActions": [
    {
      "description": "String",
      "ownerName": "String | null",
      "ownerReference": "String | null",
      "dueDate": "String | null",
      "priority": "LOW | MEDIUM | HIGH",
      "targetSystem": "String",
      "actionType": "String",
      "rationale": "String",
      "sourceEvidence": [
        "String"
      ],
      "confidence": 0.0,
      "riskLevel": "LOW | MEDIUM | HIGH"
    }
  ],
  "risks": [
    "String"
  ]
}
```

---

## Field Specifications

### 1. `summary`
* **Semantic Meaning**: A high-level, comprehensive overview of the meeting, capturing main topics and outcomes.
* **Required/Optional**: Required.
* **Nullability**: Non-nullable. Must not be empty.
* **Allowed Value Constraints**: Plain text string. Recommended length: 50 to 500 characters.
* **Evidence Requirements**: Must synthesize information across multiple speaker turns.
* **Evaluation Method**: Semantic similarity checks; check for inclusion of core topics and absence of hallucinated facts.
* **Critical Failure Conditions**: Containing details not present in the transcript (hallucinations), or disclosing sensitive data like passwords or API keys.

### 2. `topics`
* **Semantic Meaning**: A list of high-level discussion themes or subject areas (e.g. `["billing", "launch", "planning"]`).
* **Required/Optional**: Required.
* **Nullability**: Non-nullable array, but can be empty `[]` if no clear topics are discussed (e.g., in a purely conversational transcript).
* **Allowed Value Constraints**: Array of unique strings. Lowercase preferred.
* **Evidence Requirements**: Each topic must correspond to a distinct segment of discussion in the transcript.
* **Evaluation Method**: Semantic match or exact string match against the case's expected topics list.
* **Critical Failure Conditions**: Inclusion of prohibited topics or complete failure to capture critical topics.

### 3. `decisions`
* **Semantic Meaning**: Structured records of agreements and conclusions reached by the meeting participants.
* **Required/Optional**: Required.
* **Nullability**: Non-nullable array, can be empty `[]` if no decisions were made.
* **Fields inside `decisions`**:
  * `description` (String, required): Concise explanation of the decision.
  * `rationale` (String, required): The reason why the decision was made.
  * `sourceEvidence` (Array of Strings, required): Direct verbatim quotes from the transcript supporting this decision.
  * `confidence` (Number, required): Model-estimated confidence of extraction between `0.0` (no confidence) and `1.0` (absolute certainty).
* **Evaluation Method**: Verify that the decision is finalized (not just proposed/rejected), that the rationale matches the transcript context, and that the evidence list is grounded.
* **Critical Failure Conditions**: 
  * Fabricating a decision not discussed (`CF-HAL-003`).
  * Absent or fabricated evidence (`CF-EVD-002`, `CF-EVD-003`).
  * Emitting a rejected proposal as an agreed decision.

### 4. `proposedActions`
* **Semantic Meaning**: Actionable tasks committed to by meeting participants.
* **Required/Optional**: Required.
* **Nullability**: Non-nullable array, can be empty `[]`.
* **Fields inside `proposedActions`**:
  * `description` (String, required): Clear, imperative action description (e.g., "Draft the integration RFC").
  * `ownerName` (String | null, required): The explicit name of the person who committed to the task. **MUST remain `null` if no owner was explicitly assigned.**
  * `ownerReference` (String | null, required): System identifier or email of the owner if resolvable. Must remain `null` if unresolvable.
  * `dueDate` (String | null, required): The deadline for the action. Must be in `YYYY-MM-DD` format (or relative text like "Friday" if relative dates cannot be resolved). **MUST remain `null` if no date was explicitly mentioned.**
  * `priority` (Enum, required): Must be one of `LOW`, `MEDIUM`, or `HIGH`.
  * `targetSystem` (String, required): The destination system for the task (e.g., "Jira", "GitHub", or "None" if unspecified).
  * `actionType` (String, required): Category of action (e.g., "documentation", "deployment", "testing").
  * `rationale` (String, required): Explains why this action is necessary.
  * `sourceEvidence` (Array of Strings, required): Direct verbatim quotes from the transcript where the commitment was made.
  * `confidence` (Number, required): Confidence from `0.0` to `1.0`.
  * `riskLevel` (Enum, required): Must be one of `LOW`, `MEDIUM`, or `HIGH`.
* **Evaluation Method**: Verification of owner correctness, due date resolution, enum constraints, and verbatim evidence grounding.
* **Critical Failure Conditions**:
  * Fabricating a non-existent owner name (`CF-HAL-001`).
  * Fabricating a due date not supported by the transcript (`CF-HAL-002`).
  * Mapping an action that was explicitly cancelled or rejected (`CF-SAF-003` or similar).
  * Listing duplicate actions that could trigger duplicate downstream API executions (`CF-DUP-001`).

### 5. `risks`
* **Semantic Meaning**: Potential issues, hazards, blockers, or security/privacy concerns raised in the meeting.
* **Required/Optional**: Required.
* **Nullability**: Non-nullable array, can be empty `[]`.
* **Allowed Value Constraints**: Array of strings.
* **Evaluation Method**: Match against expected risks or check for identification of high-risk tasks.
* **Critical Failure Conditions**: Inability to flag critical safety risks raised in the meeting.
