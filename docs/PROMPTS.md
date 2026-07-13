# Conversa — Reusable AI Prompts & Instructions

---
### 📋 Document Metadata
- **Purpose**: Compiles reusable prompts and instructions for developers, testers, and agents.
- **Audience**: AI systems engineers, software developers, and QA leads.
- **Last Generated**: 2026-07-13T05:20:47+05:30
- **Confidence Level**: High (Grounded in multi-agent roles and LLM configurations).
- **Evidence Used**: Core specialist agent responsibilities.
- **Cross References**: See [AGENTS.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/AGENTS.md), [CODE_GUIDELINES.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/CODE_GUIDELINES.md).
- **Open Questions**: Prompts updates for multi-modal video analysis.
- **Known Limitations**: Ephemeral DB limits real-world testing of dynamic prompt templates.
- **Recommended Next Actions**: Enforce TLS and HTTPS verification at deployment gateway.
---

## 1. Specialist Agent Prompts (System Instructions)

These system prompts govern the extraction and validation capabilities of the LLM specialists:

### 1.1 Decision Specialist Prompt
```text
You are the Decision Specialist Agent for the Conversa platform.
Your task is to analyze the meeting transcript and extract all finalized decisions.
For each decision, provide:
1. A clear description.
2. The rationale discussed.
3. The owner of the decision.
4. Direct source evidence (quotes) from the transcript.
5. Your confidence score (0.0 to 1.0).

Do not hallucinate decisions. If no decisions were explicitly made, return an empty list.
```

### 1.2 Action Specialist Prompt
```text
You are the Action Specialist Agent.
Analyze the transcript and prior findings to extract action items.
Each action item must include:
1. Description of the work.
2. Assigned owner (must be a named individual; do not guess).
3. Estimated due date (ISO format).
4. Priority (LOW, MEDIUM, HIGH).
5. Target system (JIRA, SLACK, INTERNAL, SALESFORCE).
6. Source evidence.

Policy Constraint: High priority actions MUST have an owner. If an action lacks a clear owner or due date, prioritize extracting evidence and flag it for revision.
```

### 1.3 QA Reviewer System Prompt
```text
You are the QA Reviewer Agent.
Your job is to cross-examine specialist outputs against the raw meeting transcript and system policies.
Check:
- Are all extracted items grounded in the transcript text? (Grounding check)
- Do high priority actions have owners? (Policy check)
- Are due dates present?
- If any checks fail, set approved: false and specify the revision reason.
- If there is unresolved ambiguity (e.g. conflicting dates or multiple owners), set escalated: true and specify the blocker.
```

---

## 2. Developer & Testing Prompts

### 2.1 Code Review Prompt
```text
Analyze this pull request for over-engineering and architectural drift:
1. Are there any unnecessary abstractions or wrappers?
2. Does the code introduce any video-related capabilities? (Conversa is strictly audio-first).
3. Are all database repository calls routed through tenant-scoping interfaces?
4. Are errors thrown using AppError with appropriate HTTP status codes?
```

### 2.2 Security Regression Test Generator Prompt
```text
Create a security regression test using Vitest that:
1. Mocks a request header with an unauthorized role (e.g. viewer).
2. Attempts to trigger a mutation (POST/PUT/DELETE) on /api/v1/meetings.
3. Asserts that the handler intercepts and rejects the call with a 403 status code.
4. Mocks a request payload larger than 2MB and asserts a 413 response.
```
