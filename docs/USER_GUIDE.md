# Conversa User Guide

> **Current-state notice:** Conversa is an active Buildathon prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

Welcome to the Conversa User Guide. This guide covers how to operate the Conversa web application.

---

## 1. Product Purpose
Conversa is designed to help teams capture meeting audio and transcripts, extract summaries, and coordinate follow-up action items. It bridges the gap between meeting discussions and action item execution by introducing an approval-gated human-in-the-loop mechanism.

## 2. Intended Users
* **Product Managers**: To track decisions and export action items to Jira/Confluence.
* **Engineering Managers**: To extract action items from sprint reviews or architecture discussions.
* **Scrum Masters**: To quickly capture retrospective notes and sprint planning tasks.

## 3. Opening the Vercel Application
To access the live demonstration of the active build snapshot, navigate to:
```text
https://1-conversa-hermes-buildathon.vercel.app/
```

## 4. Browser Assumptions
* Modern Chrome, Firefox, Edge, or Safari browser.
* JavaScript must be enabled.
* Cookie and LocalStorage access allowed (used temporarily to persist in-memory configurations).

## 5. Using a Synthetic Transcript
The stable, verified demo pathway uses a synthetic pasted transcript. Since live transcription is an experimental wrapper, we recommend using a pasted transcript for evaluation:
1. Open the Conversa landing page.
2. Select the **Pasted Transcript** pathway.
3. Copy and paste a meeting transcript (e.g. conversational dialogues outlining roles, dates, and decisions).

## 6. Starting Meeting Analysis
1. Provide your OpenAI API key in the configuration panel (your key is kept purely in the browser session and never sent to any server other than OpenAI).
2. Click **Analyze Transcript**.
3. Wait for the processing spinner to complete (usually 3-7 seconds).

## 7. Viewing Output Sections
Upon successful analysis, the UI renders four distinct tabs/sections:
* **Summary**: A concise paragraph outlining the context and primary goals discussed in the meeting.
* **Decisions**: A bulleted list of confirmed agreements made during the discussion.
* **Risks**: A summary of potential project roadblocks and engineering constraints highlighted in the meeting.
* **Action Items**: A table containing extracted tasks, their owners, due dates, and systems of record.

## 8. Reviewing Proposed Actions
Proposed actions are displayed with detailed fields:
* **Task Title & Description**: Exact description of the proposed action.
* **Owner**: Extracted user assigned to the task.
* **Due Date**: The deadline extracted or derived from the transcript.
* **System of Record**: External destination (e.g., Jira, Slack, Salesforce).

## 9. Approving or Rejecting Actions
You can approve or reject proposed action items directly in the UI list.
* Clicking **Approve** marks the task as approved and queues it for integration.
* Clicking **Reject** removes the item or marks it as cancelled.

## 10. Viewing Audit Information
Below the actions panel, click **Show Audit Logs** to view the runtime operations, including:
* Verification status of the transaction.
* ID of the workspace/tenant scoping the session.
* Non-sensitive, redacted log payloads detailing execution steps.

## 11. Expected Error Messages
* `OpenAI API Key Missing`: Please enter a valid API key in the configuration panel.
* `Empty Transcript`: The pasted transcript must contain dialog content.
* `UNSUPPORTED_MEDIA_TYPE (415)`: Uploaded audio is in an unsupported format or contains video streams.

## 12. Privacy and Data Warnings
* **Do not paste real or confidential meeting transcripts.**
* Do not upload real meeting audio.
* Raw data is processed by OpenAI under the API terms.

## 13. Current Limitations
* Session data is lost on page reload (SPA state is volatile).
* No persistent database is active in this snapshot.

## 14. Unimplemented Features
* Live audio stream capture from microphones.
* Live webhook synchronizations to Slack or Jira.
