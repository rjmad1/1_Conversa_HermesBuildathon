# Golden Expectations: Meeting Analysis Behavior Rules

This document establishes the authoritative rules for AI-driven meeting analysis in the Conversa platform. These rules govern the extraction of owners, due dates, decisions, actions, evidence, and confidence scores.

---

## 1. Owner Extraction Rules
- **Explicit Support Only**: Extract an owner name only when the transcript contains direct evidence of that person agreeing to, claiming, or being assigned the action item.
- **Preserve Null**: When a task is discussed but no specific owner is assigned, the `ownerName` field **must strictly remain `null`**. Do not fill in placeholders like "unknown", "team", "someone", or "unassigned".
- **No Inference from Role or Title**: Do not infer the owner based on a person's job title or role (e.g. assigning all infrastructure tasks to the DevOps engineer by default) unless they explicitly claim the task in the meeting.
- **Same-Name Disambiguation**: When multiple participants share the same first name (e.g. David Miller and David Chen), use full names in `ownerName` and ensure tasks are assigned based on distinct speaker turn contexts.
- **No Facilitator Bias**: Avoid assigning actions to the meeting facilitator or leader by default. An action is assigned to the facilitator only if they explicitly take ownership of it.

---

## 2. Due Date Extraction Rules
- **Absolute Dates**: Extract explicit, absolute dates (e.g., "October 15th") whenever available.
- **Relative Date Resolution**: Resolve relative dates (e.g., "by Friday", "tomorrow", "in two weeks") only when the reference meeting date is provided in the metadata or context. If the reference meeting date is unknown or not provided, relative dates must remain unresolved or `null`.
- **Preserve Null on Insufficient Deadline Evidence**: If no deadline is mentioned, or the time estimate is too vague (e.g., "sometime later", "in the future"), `dueDate` **must remain `null`**.
- **Retain Ambiguity**: If participants propose contradictory dates and leave the meeting without resolving them, the `dueDate` must remain `null`. 
- **No Aspirational Deadlines**: Do not convert aspirational language (e.g., "It would be great if we finished this by Friday") into a strict deadline unless there is clear consensus or a commitment to that date.

---

## 3. Decision Extraction Rules
- **Proposals vs. Final Decisions**: Distinguish final, agreed-upon decisions from proposals or brainstorming ideas. A decision is only valid if there is clear agreement or no opposition.
- **Exclude Rejected Ideas**: Do not extract decisions that were discussed but explicitly rejected or abandoned by the team.
- **Capture Corrected Decisions**: When a decision is updated or corrected during the course of the meeting (e.g. pushing a date or changing a provider), only the final, corrected decision must be emitted. The superseded version must not be extracted.
- **Exclude Hypothetical Discussions**: Do not extract decisions from purely hypothetical discussions (e.g. "If we had more money, we would choose AWS").
- **Preserve Contradictory Decisions as Risks**: If two conflicting decisions are made and left unresolved, the system must not emit both as valid; it must either omit them or flag the conflict in the `risks` array.

---

## 4. Action Extraction Rules
- **Commitments vs. Suggestions**: Extract proposed actions only when they represent clear commitments. Suggestions, advice, or brainstorming remarks (e.g., "You should look into that") must not generate action items.
- **Exclude Cancelled Actions**: If a task is proposed but explicitly cancelled before the meeting ends, it must not be emitted.
- **Exclude Negated Commitments**: If a participant explicitly declines a task request (e.g., "I cannot do that"), no action item must be created for them.
- **Avoid Duplicates**: If a task is mentioned multiple times or confirmed repeatedly by the same owner, deduplicate and output a single proposed action.
- **Preserve Distinct Outcomes**: Keep separate action items if the outcomes differ (e.g., "Priya drafts spec" and "Priya reviews spec" are distinct and must not be merged).
- **No Automated Unsafe Actions**: High-risk destructive actions (e.g., deleting tables, purging data) must have their `riskLevel` set to `HIGH` and `targetSystem` set to `None` to prevent automated execution without human approval.

---

## 5. Evidence Grounding Rules
- **Direct Traceability**: The `sourceEvidence` array must contain direct verbatim quotes from the transcript text.
- **Sufficient Evidence**: The quoted text must be sufficient to support the extracted decision or action (e.g., it must capture both the action description and the owner's agreement).
- **No Surrounding Noise**: Do not include excessive, unrelated sentences in the evidence array. Keep evidence concise.
- **No Paraphrasing or Invention**: Never alter the quote or invent paraphrased quotations. The quote must match the transcript exactly.

---

## 6. Extraction Confidence Rules
- **High Confidence (0.8 - 1.0)**: Requires direct, unambiguous support in the transcript (e.g. "I will do X by Friday").
- **Medium Confidence (0.5 - 0.7)**: Applies to items that are supported but contain minor ambiguity (e.g. implicit agreement like "Let's do X" followed by a nod/yes).
- **Low Confidence (0.1 - 0.4)**: Applies to uncertain extractions. If an item is speculative or has weak support, it should generally not be emitted.
- **No Concealed Uncertainty**: If an item has weak evidence, the system must not emit it with a high confidence score. Unsupported items must be completely excluded rather than emitted with low confidence.
