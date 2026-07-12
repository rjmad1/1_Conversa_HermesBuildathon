# User Guide

> **Current-state notice:** Conversa is an active Buildathon prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

Conversa helps teams capture meeting transcripts, extract action items, and manage follow-up tasks.

## Opening the App
Open the Vercel deployed instance at:
```text
https://1-conversa-hermes-buildathon.vercel.app/
```

## Intended Demo Flow
To ensure a stable demonstration, use the **Pasted Transcript** pathway:
1. Paste a mock transcript detailing team member roles and actionable items (e.g. "Alice will finish the API docs by Friday").
2. Enter your OpenAI API key in the configuration panel (this key remains local in your browser memory).
3. Click **Analyze Transcript** to trigger parsing.
4. Review the extracted output across four tabs:
   * **Summary**: Concise overview of the meeting.
   * **Decisions**: Key agreements.
   * **Risks**: Roadblocks identified.
   * **Action Items**: Table of tasks.
5. Review proposed action items. Click **Approve** or **Reject** to manage the workflow.
6. Click **Show Audit Logs** to review the scoped logging trace.
